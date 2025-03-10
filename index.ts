import { Server, Socket } from "socket.io";

import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let mobileSocket: Socket | null = null;
let viewerSocket: Socket | null = null;

io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("offer", (offer: any) => {
    mobileSocket = socket;
    if (viewerSocket) {
      viewerSocket.emit("offer", offer);
    }
  });

  socket.on("answer", (answer: any) => {
    if (mobileSocket) {
      mobileSocket.emit("answer", answer);
    }
  });

  socket.on("candidate", (candidate: any) => {
    if (mobileSocket) {
      mobileSocket.emit("candidate", candidate);
    }
    if (viewerSocket) {
      viewerSocket.emit("candidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket === mobileSocket) mobileSocket = null;
    if (socket === viewerSocket) viewerSocket = null;
  });
});

server.listen(8080, () => console.log("Server running on port 8080"));
