import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [result] = await db.query(
            "SELECT * FROM emotion"
        )

        return NextResponse.json({ message: "ok", result }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(requset) {
    try {

        const body = await requset.json()
        const { token, emotion_id } = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        if (!emotion_id) {
            return NextResponse.json({ message: "โปรดเลือกความรู้สึกด้วยครับ" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (rows.length == 0) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const UserTokenLocalDB = rows[0]
        const expiresTime = new Date(UserTokenLocalDB.token_expires).getTime()

        if (expiresTime < Date.now()) {
            return NextResponse.json({ message: "หมดเวลาใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (row_users.length == 0) {
            return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const UserLocalDB = row_users[0]
        console.log(UserLocalDB.id)

        await db.query(
            "INSERT INTO user_emotion (emotion_id, user_id , created_at) VALUES (?, ?, NOW())", [emotion_id, UserLocalDB.id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
