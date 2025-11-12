import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

const API_TOKEN = process.env.API_TOKEN;
const API_URL = "https://sharingbox.online/bigbot/intra/api/v1/aichat/etechMental";

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "chat") {
        const userMessage = data.message;

        const bodyData = {
          messageInput: userMessage,
          markdown: "1",
          memory: "0",
          botId: "BBOT2025110001",
        };

        console.log(bodyData)

        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify(bodyData)
        });

        const result = await res.json();
        console.log("🤖 API Response:", result);

        const aiReply = result

        ws.send(
          JSON.stringify({
            type: "chat",
            message: aiReply,
            role: "ai",
          })
        );
      }
    } catch (err) {
      console.error("❌ Error:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ API",
        })
      );
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

console.log("🚀 WebSocket Server running on ws://localhost:8080");
