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