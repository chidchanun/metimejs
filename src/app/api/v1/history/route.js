import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"

export async function POST(request) {
    try {
        const body = await request.json()
        const { token, room_id, message } = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 })
        }

        if (!room_id || !message) {
            return NextRequest.json({ message: "Internal Server Error" }, { status: 500 })
        }

        const [row] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (row.length == 0) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 })
        }

        const UserTokenLocalDB = row[0]

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        const UserLocalDB = row_user[0]

        await db.query(
            "INSERT INTO history (message, room_id, user_id, created_at) VALUES (?,?,?,NOW())", [message,room_id,UserLocalDB.id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}