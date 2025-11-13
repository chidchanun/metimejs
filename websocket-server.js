import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

const API_TOKEN = process.env.API_TOKEN;
const API_URL = "https://sharingbox.online/bigbot/intra/api/v1/aichat/etechMental";
const NOTICE_API_URL = "https://localhost:3000/api/v1/notice"; 

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
                const role = Number(data.role);
                if (![1, 2].includes(role)) {
                    ws.send(JSON.stringify({ type: "error", message: "Role ไม่ถูกต้อง" }));
                    return;
                }
                clients.set(ws, { role, lastNotice: 0 });
                console.log("Client role set:", role);
                return;
            }

            const clientInfo = clients.get(ws);
            if (!clientInfo) {
                ws.send(JSON.stringify({ type: "error", message: "กรุณาส่ง init ก่อน" }));
                return;
            }

            // ======================
            // Chat AI
            // ======================
            if (data.type === "chat") {
                const userMessage = data.message;

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
                const aiReply = result

                ws.send(
                    JSON.stringify({
                        type: "chat",
                        message: aiReply,
                        role: "ai",
                    })
                );
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

                // ส่ง POST request ไป API แทนบันทึก DB
                const apiRes = await fetch("http://localhost:3000/api/v1/notice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: noticeText }),
                });

                if (!apiRes.ok) {
                    ws.send(JSON.stringify({ type: "error", message: "ไม่สามารถบันทึก notice ผ่าน API ได้" }));
                    return;
                }

                const apiData = await apiRes.json();
                const noticeId = apiData.notice_id; // สมมติ API คืนค่า notice_id

                clientInfo.lastNotice = now;

                // ส่งไปยังทุกอาจารย์ฝ่ายพัฒนา
                for (const [client, info] of clients.entries()) {
                    if (info.role === 2 && client.readyState === ws.OPEN) {
                        client.send(
                            JSON.stringify({
                                type: "notice",
                                message: noticeText,
                                notice_id: noticeId,
                            })
                        );
                    }
                }
            }
        } catch (err) {
            console.error("Error:", err);
            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "เกิดข้อผิดพลาดในการประมวลผล",
                })
            );
        }
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected", clients.get(ws));
        clients.delete(ws);
    });
});

console.log("WebSocket Server running on ws://localhost:8080");
