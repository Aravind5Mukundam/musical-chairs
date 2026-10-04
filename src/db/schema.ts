import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- */
/* Users                              */
/* ---------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    clerkUserId: varchar("clerk_user_id", {
      length: 255,
    })
      .notNull()
      .unique(),

    displayName: varchar("display_name", {
      length: 100,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);

/* ---------------------------------- */
/* Games                              */
/* ---------------------------------- */

export const games = pgTable(
  "games",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    code: varchar("code", {
      length: 6,
    })
      .notNull()
      .unique(),

    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id),

    maxPlayers: integer("max_players")
      .notNull(),

    status: varchar("status", {
      length: 30,
    })
      .notNull()
      .default("WAITING"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);

/* ---------------------------------- */
/* Game Sessions                      */
/* ---------------------------------- */

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),

    sessionNumber: integer("session_number")
      .notNull()
      .default(1),

    status: varchar("status", {
      length: 30,
    })
      .notNull()
      .default("WAITING"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    startedAt: timestamp("started_at"),

    endedAt: timestamp("ended_at"),
  },

  (table) => ({
    gameSessionUnique: uniqueIndex(
      "game_session_unique"
    ).on(
      table.gameId,
      table.sessionNumber
    ),
  })
);

/* ---------------------------------- */
/* Game Players                       */
/* ---------------------------------- */

export const gamePlayers = pgTable(
  "game_players",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id),

    userId: uuid("user_id")
      .references(() => users.id),
    
    displayName: varchar("display_name", {
      length: 30,
    }).notNull(),

    isEliminated: boolean("is_eliminated")
      .notNull()
      .default(false),

    joinedAt: timestamp("joined_at")
      .defaultNow()
      .notNull(),

    leftAt: timestamp("left_at"),
  }
);

/* ---------------------------------- */
/* Game Rounds                        */
/* ---------------------------------- */

export const gameRounds = pgTable(
  "game_rounds",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id),

    roundNumber: integer(
      "round_number"
    ).notNull(),

    playerCount: integer(
      "player_count"
    ).notNull(),

    chairCount: integer(
      "chair_count"
    ).notNull(),

    status: varchar("status", {
      length: 30,
    })
      .notNull()
      .default("PENDING"),

    /*
     * Degrees moved per second.
     *
     * Example:
     * 90 = one quarter rotation
     * every second.
     */
    movementSpeed: integer(
      "movement_speed"
    )
      .notNull()
      .default(90),

    /*
     * Total time the round has
     * spent paused.
     *
     * Stored in milliseconds.
     */
    totalPausedMs: integer(
      "total_paused_ms"
    )
      .notNull()
      .default(0),

    startedAt: timestamp(
      "started_at"
    ),

    pausedAt: timestamp(
      "paused_at"
    ),
pausedAngle: integer("paused_angle"),
    completedAt: timestamp(
      "completed_at"
    ),

    eliminatedPlayerId: uuid(
      "eliminated_player_id"
    ),

    createdAt: timestamp(
      "created_at"
    )
      .defaultNow()
      .notNull(),
  }
);

/* ---------------------------------- */
/* Game Round Players                 */
/* ---------------------------------- */

export const gameRoundPlayers = pgTable(
  "game_round_players",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    roundId: uuid("round_id")
      .notNull()
      .references(() => gameRounds.id),

    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.id),

    initialAngle: integer(
      "initial_angle"
    ).notNull(),
    pausedAngle: integer("paused_angle"),

    chairIndex: integer(
      "chair_index"
    ),

    distanceToChair: integer(
      "distance_to_chair"
    ),

    isEliminated: boolean(
      "is_eliminated"
    )
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at"
    )
      .defaultNow()
      .notNull(),
  }
);