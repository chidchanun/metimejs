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
        const { message, token } = body;

        console.log("pass1")

        if (!message || message.trim() === "") {
            return NextResponse.json(
                { error: "Message ไม่สามารถว่างได้" },
                { status: 400 }
            );
        }
        console.log("pass2")

        if (!token) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }
        console.log("pass3")

        const [row_token] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (row_token.length == 0) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }
        console.log("pass4")

        const UserTokenLocalDB = await row_token[0]

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?", UserTokenLocalDB.user_id
        )

        const UserLocalDB = await row_user[0]

        const [check_notice] = await db.query(
            "SELECT * FROM notice WHERE user_id = ?", [UserLocalDB.id]
        )

        if (check_notice.length >= 1){
            return NextResponse.json({message : "โปรดรอฝ่ายพัฒนาตอบกลับ"}, {status : 400})
        }


        const [result] = await db.query(
            "INSERT INTO notice (message, created_at, read_by, status, user_id) VALUES (?, NOW(), JSON_ARRAY(), 'unread', ?)",
            [message, UserLocalDB.id]
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
