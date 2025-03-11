require("dotenv").config();

const { ExpressPeerServer } = require("peer");
const express = require("express");
const cors = require("cors");

const http = require("http");

const app = express();

// Enable CORS
app.use(cors());

const server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello world!");
});

// Use the PORT environment variable provided by Railway, or fallback to 9000 for local development
const PORT = process.env.PORT || 9000;

app.use(express.static("public"));

const peerServer = ExpressPeerServer(server, {
  debug: true,
  allow_discovery: true,
});

app.use("/myapp", peerServer);

server.listen(PORT, () => {
  console.log(`PeerJS server running on port ${PORT}`);
});

// Add error handling
server.on("error", (error) => {
  console.error("Server error:", error);
});
