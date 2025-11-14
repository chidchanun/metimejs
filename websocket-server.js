import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

const API_TOKEN = process.env.API_KEY;
const API_URL = "https://sharingbox.online/bigbot/intra/api/v1/aichat/etechMental";
const NOTICE_API_URL = "http://localhost:3000/api/v1/notice";

const clients = new Map();
const NOTICE_DEBOUNCE_MS = 3000; // 3 วินาที

wss.on("connection", (ws) => {
    console.log("✅ Client connected");

    ws.on("message", async (msg) => {
        try {
            const data = JSON.parse(msg);

            // ======================
            // Init client + role
            // ======================
            if (data.type === "init") {
                console.log("Received init data:", data); // <-- log ทั้ง object

                const role = Number(data.role);
                const token = String(data.token);
                const ChatTeacher = Boolean(data.ChatTeacher);
                const roomId = Number(data.roomId);

                if (![1, 2].includes(role)) {
                    ws.send(JSON.stringify({ type: "error", message: "Role ไม่ถูกต้อง" }));
                    return;
                }

                clients.set(ws, { role, token, ChatTeacher, roomId, lastNotice: 0 });

                ws.send(JSON.stringify({ type: "init_ok" }));
                return;
            }

            const clientInfo = clients.get(ws);

            if (!clientInfo) {
                console.log("No clientInfo found for ws:", ws); // <-- log กรณีไม่ได้ส่ง init
                ws.send(JSON.stringify({ type: "error", message: "กรุณาส่ง init ก่อน" }));
                return;
            }

            // ======================
            // Chat
            // ======================
            if (data.type === "chat") {
                const userMessage = data.message;

                if (clientInfo.ChatTeacher) {
                    const roomId = clientInfo.roomId;
                    for (const [client, info] of clients.entries()) {
                        // ส่งเฉพาะคนที่อยู่ในห้องเดียวกัน และไม่ใช่คนส่ง
                        if (info.roomId === roomId && client !== ws && client.readyState === ws.OPEN) {
                            client.send(JSON.stringify({
                                type: "chat",
                                message: userMessage,
                                role: client.role === 1 ? "student" : "teacher",
                            }));
                        }
                    }
                    // ไม่ต้องส่ง ws.send กลับไปยังตัวเอง
                    return;
                }

                // Chat AI
                const bodyData = {
                    messageInput: userMessage,
                    markdown: "1",
                    memory: "0",
                    botId: "BBOT2025110001",
                };

                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${API_TOKEN}`,
                    },
                    body: JSON.stringify(bodyData),
                });

                const result = await res.json();
                const aiReply = result || "AI ไม่สามารถตอบกลับได้";

                ws.send(JSON.stringify({
                    type: "chat",
                    message: aiReply,
                    role: "ai"
                }));
                return;
            }

            // ======================
            // Notice -> อาจารย์ role = 2
            // ======================
            if (data.type === "notice") {
                const now = Date.now();
                if (now - clientInfo.lastNotice < NOTICE_DEBOUNCE_MS) {
                    ws.send(JSON.stringify({ type: "error", message: "โปรดรอซักครู่ก่อนส่ง notice ใหม่" }));
                    return;
                }

                const noticeText = data.message;

                const apiRes = await fetch(NOTICE_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: noticeText, token: clientInfo.token }),
                });

                const apiData = await apiRes.json();

                if (!apiRes.ok) {

                    ws.send(JSON.stringify({
                        type: "error_notice",
                        message: apiData.message || "ไม่สามารถบันทึก notice ผ่าน API ได้"
                    }));
                    clients.delete(ws)
                    return;
                }

                const noticeId = apiData.notice_id;
                clientInfo.lastNotice = now;

                // ส่งให้ทุกอาจารย์
                for (const [client, info] of clients.entries()) {
                    if (info.role === 2 && client.readyState === ws.OPEN) {
                        client.send(JSON.stringify({
                            type: "notice",
                            message: noticeText,
                            notice_id: noticeId,
                        }));
                    }
                }
                return;
            }

        } catch (err) {
            console.error("Error:", err);
            ws.send(JSON.stringify({ type: "error", message: "เกิดข้อผิดพลาดในการประมวลผล" }));
        }
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected", clients.get(ws));
        clients.delete(ws);
    });
});

console.log("WebSocket Server running on ws://localhost:8080");
