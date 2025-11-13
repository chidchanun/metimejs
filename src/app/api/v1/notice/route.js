import { NextResponse } from "next/server";
import { db } from "@/app/lib/db.js"; // import db.js ของคุณ
export async function GET() {
    try {
        const [rows] = await db.query("SELECT * FROM notice ORDER BY created_at DESC LIMIT 50");
        return NextResponse.json({ success: true, result: rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: "ไม่สามารถโหลด notice ได้" }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message || message.trim() === "") {
            return NextResponse.json(
                { error: "Message ไม่สามารถว่างได้" },
                { status: 400 }
            );
        }

        // บันทึกลง DB
        const [result] = await db.query(
            "INSERT INTO notice (message, created_at, read_by, status) VALUES (?, NOW(), JSON_ARRAY(), 'unread')",
            [message]
        );

        return NextResponse.json({
            success: true,
            notice_id: result.insertId,
            message: message,
        });
    } catch (err) {
        console.error("Notice API error:", err);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการบันทึก notice" },
            { status: 500 }
        );
    }
}
