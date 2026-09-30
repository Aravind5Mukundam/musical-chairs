import { z } from "zod";

export const createGameSchema = z.object({
  maxPlayers: z
    .number()
    .int()
    .min(2)
    .max(50),
});

export const joinGameSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6)
    .transform((value) =>
      value.toUpperCase()
    ),

  name: z
    .string()
    .trim()
    .min(1)
    .max(30),
});