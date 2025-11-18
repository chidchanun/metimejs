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


        if (!message || message.trim() === "") {
            return NextResponse.json(
                { error: "Message ไม่สามารถว่างได้" },
                { status: 400 }
            );
        }

        if (!token) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }

        const [row_token] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (row_token.length == 0) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }

        const UserTokenLocalDB = await row_token[0]

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        const UserLocalDB = await row_user[0]

        const [check_notice] = await db.query(
            "SELECT * FROM notice WHERE user_id = ? AND status = ?", [UserLocalDB.id, "unread"]
        )

        if (check_notice.length >= 1) {
            return NextResponse.json({ message: "โปรดรอฝ่ายพัฒนาตอบกลับ" }, { status: 400 })
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


export async function PATCH(request) {
    try {
        const body = await request.json()
        const { token, notice_id } = body
        if (!token) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }

        if (!notice_id) {
            return NextResponse.json({ message: "ไม่พบการเเจ้งเตือน" }, { status: 400 })
        }


        const [row_token] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (row_token.length == 0) {
            return NextResponse.json({ messaeg: "โปรดเข้าสู่ระบบอีกครั้ง" }, { status: 401 })
        }

        const UserTokenLocalDB = await row_token[0]

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        const UserLocalDB = await row_user[0]

        if (UserLocalDB.role_id === 1) {
            return NextResponse.json({ message: "ไม่มีสิทธิ์ในการเข้าถึง" }, { status: 403 })
        }

        const [row_room] = await db.query(
            "SELECT * FROM room WHERE teacher_id = ? AND room_activate = 1", [UserLocalDB.id]
        )

        const roomData = row_room[0]
        console.log(roomData)

        await db.query(
            "UPDATE notice SET status = ? , room_id = ? WHERE notice_id = ?", ["read", roomData.room_id, notice_id.notice_id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}