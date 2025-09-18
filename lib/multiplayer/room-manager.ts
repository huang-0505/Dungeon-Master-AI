import type { GameRoom, Player, GameMessage } from "./types"
import { roomEventEmitter } from "./event-emitter"

// In-memory storage for demo - replace with database in production
class RoomManager {
  private rooms: Map<string, GameRoom> = new Map()
  private playerRooms: Map<string, string> = new Map() // playerId -> roomId

  private emitRoomUpdate(roomId: string, room: GameRoom) {
    roomEventEmitter.emit(roomId, {
      type: "room-update",
      room,
    })
  }

  createRoom(name: string, campaign: string, creatorId: string, maxPlayers = 4): GameRoom {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()

    const room: GameRoom = {
      id: roomId,
      name,
      campaign,
      maxPlayers,
      creatorId,
      players: [],
      gameState: {
        currentTurn: 0,
        phase: "waiting",
        messages: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.rooms.set(roomId, room)
    return room
  }

  joinRoom(roomId: string, player: Omit<Player, "joinedAt">): GameRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Room is full")
    }

    if (room.players.some((p) => p.id === player.id)) {
      throw new Error("Player already in room")
    }

    const newPlayer: Player = {
      ...player,
      joinedAt: Date.now(),
    }

    room.players.push(newPlayer)
    room.updatedAt = Date.now()
    this.playerRooms.set(player.id, roomId)

    // Add system message
    room.gameState.messages.push({
      author: "system",
      text: `${player.name} joined the adventure as a ${player.characterClass}`,
      timestamp: Date.now(),
    })

    this.emitRoomUpdate(roomId, room)

    return room
  }

  leaveRoom(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const playerIndex = room.players.findIndex((p) => p.id === playerId)
    if (playerIndex === -1) return null

    const player = room.players[playerIndex]
    room.players.splice(playerIndex, 1)
    room.updatedAt = Date.now()
    this.playerRooms.delete(playerId)

    // Add system message
    room.gameState.messages.push({
      author: "system",
      text: `${player.name} left the adventure`,
      timestamp: Date.now(),
    })

    this.emitRoomUpdate(room.id, room)

    // Remove empty rooms
    if (room.players.length === 0) {
      this.rooms.delete(roomId)
      return null
    }

    return room
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null
  }

  getRoomByPlayer(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId)
    return roomId ? this.rooms.get(roomId) || null : null
  }

  listRooms(): GameRoom[] {
    return Array.from(this.rooms.values())
  }

  updatePlayerAction(playerId: string, action: string): GameRoom | null {
    const room = this.getRoomByPlayer(playerId)
    if (!room) return null

    const player = room.players.find((p) => p.id === playerId)
    if (!player) return null

    player.currentAction = action
    player.isReady = true
    room.updatedAt = Date.now()

    // Check if all players are ready
    const allReady = room.players.every((p) => p.isReady)
    if (allReady && room.gameState.phase === "collecting-actions") {
      room.gameState.phase = "processing"
    }

    this.emitRoomUpdate(room.id, room)

    return room
  }

  startNewTurn(roomId: string): GameRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    // Reset player states for new turn
    room.players.forEach((player) => {
      player.isReady = false
      player.currentAction = undefined
    })

    room.gameState.currentTurn += 1
    room.gameState.phase = "collecting-actions"
    room.updatedAt = Date.now()

    this.emitRoomUpdate(roomId, room)

    return room
  }

  addMessage(roomId: string, message: Omit<GameMessage, "timestamp">): GameRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.gameState.messages.push({
      ...message,
      timestamp: Date.now(),
    })
    room.updatedAt = Date.now()

    this.emitRoomUpdate(roomId, room)

    return room
  }

  deleteRoom(roomId: string, requesterId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    // Only the creator can delete the room
    if (room.creatorId !== requesterId) {
      throw new Error("Only the room creator can delete this room")
    }

    // Remove all players from their room mapping
    room.players.forEach((player) => {
      this.playerRooms.delete(player.id)
    })

    // Delete the room
    this.rooms.delete(roomId)

    // Emit room deletion event
    roomEventEmitter.emit(roomId, {
      type: "room-deleted",
      roomId,
    })

    return true
  }
}

export const roomManager = new RoomManager()
