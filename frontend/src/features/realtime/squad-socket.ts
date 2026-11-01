import { io, type Socket } from "socket.io-client";

import { API_URL } from "@shared/config/env";

import { REALTIME_PATH } from "./events";
import { getSocketUrl } from "./get-socket-url";

let socket: Socket | null = null;
let acceptReconnect = true;

export function getSquadSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(API_URL), {
      path: REALTIME_PATH,
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socket;
}

export function connectSquadSocket(): Socket {
  acceptReconnect = true;
  const current = getSquadSocket();
  current.io.reconnection(true);
  current.connect();

  return current;
}

export function squadSocketCanReconnect(): boolean {
  return acceptReconnect;
}

export function closeSquadSocket(): void {
  acceptReconnect = false;

  if (!socket) {
    return;
  }

  socket.io.reconnection(false);
  socket.disconnect();
}

export function disconnectSquadSocket(): void {
  socket?.disconnect();
}
