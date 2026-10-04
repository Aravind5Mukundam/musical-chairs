ALTER TABLE "game_rounds" ADD COLUMN "movement_speed" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_rounds" ADD COLUMN "total_paused_ms" integer DEFAULT 0 NOT NULL;