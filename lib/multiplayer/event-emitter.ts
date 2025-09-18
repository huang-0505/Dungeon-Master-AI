// Simple event emitter for room updates
class RoomEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  subscribe(roomId: string, callback: (data: any) => void) {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set())
    }
    this.listeners.get(roomId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const roomListeners = this.listeners.get(roomId)
      if (roomListeners) {
        roomListeners.delete(callback)
        if (roomListeners.size === 0) {
          this.listeners.delete(roomId)
        }
      }
    }
  }

  emit(roomId: string, data: any) {
    const roomListeners = this.listeners.get(roomId)
    if (roomListeners) {
      roomListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("[v0] Error in room event listener:", error)
        }
      })
    }
  }

  getRoomListenerCount(roomId: string): number {
    return this.listeners.get(roomId)?.size || 0
  }
}

export const roomEventEmitter = new RoomEventEmitter()
