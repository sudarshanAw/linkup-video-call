import type { WebSocket } from "ws";

interface RoomParticipant { ws: WebSocket; userName: string; }
interface Room { id: string; participants: Map<WebSocket, RoomParticipant>; }

export interface IStorage {
  createRoom(roomId: string): Room;
  getRoom(roomId: string): Room | undefined;
  addParticipant(roomId: string, ws: WebSocket, userName: string): boolean;
  removeParticipant(ws: WebSocket): { roomId: string; userName: string } | undefined;
  getRoomParticipants(roomId: string): RoomParticipant[];
  getOtherParticipant(roomId: string, ws: WebSocket): RoomParticipant | undefined;
  getRoomIdForWs(ws: WebSocket): string | undefined;
}

export class MemStorage implements IStorage {
  private rooms = new Map<string, Room>();
  private wsToRoom = new Map<WebSocket, string>();

  createRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    if (!room) { room = { id: roomId, participants: new Map() }; this.rooms.set(roomId, room); }
    return room;
  }

  getRoom(roomId: string) { return this.rooms.get(roomId); }

  addParticipant(roomId: string, ws: WebSocket, userName: string): boolean {
    let room = this.rooms.get(roomId) || this.createRoom(roomId);
    if (room.participants.size >= 2) return false;
    room.participants.set(ws, { ws, userName });
    this.wsToRoom.set(ws, roomId);
    return true;
  }

  removeParticipant(ws: WebSocket) {
    const roomId = this.wsToRoom.get(ws);
    if (!roomId) return undefined;
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const participant = room.participants.get(ws);
    if (!participant) return undefined;
    room.participants.delete(ws);
    this.wsToRoom.delete(ws);
    if (room.participants.size === 0) this.rooms.delete(roomId);
    return { roomId, userName: participant.userName };
  }

  getRoomParticipants(roomId: string) {
    return Array.from(this.rooms.get(roomId)?.participants.values() ?? []);
  }

  getOtherParticipant(roomId: string, ws: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    for (const [key, value] of room.participants) {
      if (key !== ws) return value;
    }
    return undefined;
  }

  getRoomIdForWs(ws: WebSocket) { return this.wsToRoom.get(ws); }
}

export const storage = new MemStorage();
