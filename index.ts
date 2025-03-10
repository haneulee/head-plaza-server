const express = require("express");
const http = require("http");
const { Server, Socket } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// 🚀 CORS 설정 (모든 도메인 허용, 필요 시 특정 도메인만 허용 가능)
app.use(cors({ origin: "*" }));

const io = new Server(server, {
  cors: {
    origin: "*", // 필요에 따라 특정 도메인만 허용 가능 (예: ["https://your-frontend.com"])
    methods: ["GET", "POST"],
  },
});

let viewerSocket: { emit: (arg0: string, arg1: any) => void } | null = null; // 데스크탑(뷰어) 소켓
let mobileSocket: { id: string } | null = null; // 모바일(스트리밍) 소켓

io.on("connection", (socket: any) => {
  console.log(`✅ 클라이언트 연결됨: ${socket.id}`);

  // 📌 모바일이 비디오 스트리밍 시작할 때
  socket.on("start-stream", () => {
    console.log("📲 모바일 스트리밍 시작");
    mobileSocket = socket;
  });

  // 📌 모바일에서 비디오 데이터 전송할 때
  socket.on("video-data", (data: any) => {
    if (viewerSocket) {
      viewerSocket.emit("video-data", data);
    }
  });

  // 📌 데스크탑(뷰어) 접속
  socket.on("viewer", () => {
    console.log("🖥️ 데스크탑 뷰어 연결됨");
    viewerSocket = socket;
  });

  // 📌 연결이 끊어졌을 때
  socket.on("disconnect", () => {
    console.log(`❌ 클라이언트 연결 종료: ${socket.id}`);
    if (socket === mobileSocket) mobileSocket = null;
    if (socket === viewerSocket) viewerSocket = null;
  });
});

// 🚀 서버 실행 (포트 8080)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🌍 WebSocket 서버 실행 중: ws://localhost:${PORT}`);
});
