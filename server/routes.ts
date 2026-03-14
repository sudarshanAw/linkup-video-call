import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { log } from "./index";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/room/:roomId", (req, res) => {
    const room = storage.getRoom(req.params.roomId);
    const count = room ? room.participants.size : 0;
    res.json({ exists: !!room, participantCount: count, isFull: count >= 2 });
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleSignalingMessage(ws, message);
      } catch (e) {
        log(`Invalid message: ${e}`, "ws");
      }
    });

    ws.on("close", () => {
      const removed = storage.removeParticipant(ws);
      if (removed) {
        const room = storage.getRoom(removed.roomId);
        if (room) {
          for (const [, participant] of room.participants) {
            sendMessage(participant.ws, { type: "user-left", userName: removed.userName });
          }
        }
      }
    });
  });

  function handleSignalingMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case "join": {
        const { roomId, userName } = message;
        const added = storage.addParticipant(roomId, ws, userName);
        if (!added) { sendMessage(ws, { type: "room-full" }); return; }
        const participants = storage.getRoomParticipants(roomId);
        sendMessage(ws, { type: "room-ready", participants: participants.map(p => p.userName) });
        const other = storage.getOtherParticipant(roomId, ws);
        if (other) sendMessage(other.ws, { type: "user-joined", userName });
        break;
      }
      case "offer":
      case "answer":
      case "ice-candidate": {
        const roomId = storage.getRoomIdForWs(ws);
        if (!roomId) return;
        const other = storage.getOtherParticipant(roomId, ws);
        if (other) sendMessage(other.ws, message);
        break;
      }
    }
  }

  function sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }

  return httpServer;
}
