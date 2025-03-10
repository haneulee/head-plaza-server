const { WebSocketServer } = require("ws");
const { createServer } = require("http");
const { join } = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { writeFile } = require("fs/promises");
const express = require("express");
const fs = require("fs");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/stream",
});

// CORS 설정 추가
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Add middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(join(process.cwd(), "public")));

// 비디오 저장 디렉토리
const VIDEOS_DIR = join(process.cwd(), "public", "videos");

// Ensure the videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// WebSocket 연결 관리
const connections = new Map();

const upload = multer({ storage: multer.memoryStorage() });

wss.on("connection", (ws) => {
  const id = uuidv4();
  connections.set(id, ws);

  ws.on("message", (data) => {
    // 모바일에서 받은 스트림을 데스크톱 클라이언트에게 전달
    connections.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    connections.delete(id);
  });
});

// 비디오 업로드 API
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    const videoId = uuidv4();
    const videoPath = join(VIDEOS_DIR, `${videoId}.webm`);

    const videoBuffer = req.file?.buffer;
    if (!videoBuffer) {
      throw new Error("No file uploaded");
    }
    await writeFile(videoPath, videoBuffer);

    res.json({ videoId });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 비디오 스트리밍 API
app.get("/api/videos/:videoId", (req, res) => {
  const videoPath = join(VIDEOS_DIR, `${req.params.videoId}.webm`);
  res.sendFile(videoPath);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
