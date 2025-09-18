import { z } from "zod"

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  characterClass: z.string(),
  isReady: z.boolean(),
  currentAction: z.string().optional(),
  joinedAt: z.number(),
})

export const GameRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  campaign: z.string(),
  maxPlayers: z.number(),
  creatorId: z.string(),
  players: z.array(PlayerSchema),
  gameState: z.object({
    currentTurn: z.number(),
    phase: z.enum(["waiting", "collecting-actions", "processing", "completed"]),
    messages: z.array(
      z.object({
        author: z.enum(["ai", "player", "system"]),
        text: z.string(),
        timestamp: z.number(),
        playerId: z.string().optional(),
      }),
    ),
  }),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type Player = z.infer<typeof PlayerSchema>
export type GameRoom = z.infer<typeof GameRoomSchema>
export type GameMessage = GameRoom["gameState"]["messages"][0]
