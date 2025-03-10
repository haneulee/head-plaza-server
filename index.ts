import { NextFunction, Request, Response } from "express";

import { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import express from "express";
import fs from "fs";
import { join } from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { writeFile } from "fs/promises";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/stream",
});

// CORS 설정 추가
app.use((req: Request, res: Response, next: NextFunction) => {
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
const connections = new Map<string, WebSocket>();

const upload = multer({ storage: multer.memoryStorage() });

wss.on("connection", (ws: WebSocket) => {
  const id = uuidv4();
  connections.set(id, ws);

  ws.on("message", (data: any) => {
    // 모바일에서 받은 스트림을 데스크톱 클라이언트에게 전달
    connections.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    connections.delete(id);
  });
});

// 비디오 업로드 API
app.post(
  "/api/upload",
  upload.single("video"),
  async (req: Request, res: Response) => {
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
  }
);

// 비디오 스트리밍 API
app.get("/api/videos/:videoId", (req: Request, res: Response) => {
  const videoPath = join(VIDEOS_DIR, `${req.params.videoId}.webm`);
  res.sendFile(videoPath);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
