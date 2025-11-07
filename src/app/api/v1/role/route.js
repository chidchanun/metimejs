import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const { token } = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 200 })
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens = ?"[token]
        )

        if (rows.lenght == 0) {
            return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" })
        }

        const UserTokenLocalDB = rows[0]
        const expiresTime = new Date(UserTokenLocalDB.token_expires).getTime();

        if (expiresTime < Date.now()) {
            return NextResponse.json({message : "หมดเวลาใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (row_users.lenght == 0) {
            return NextResponse.json({message : "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง"})
        }

        const UserLocalDB = row_users[0]

        const [result] = await db.query(
            "SELECT * FROM role_id = ?" , [UserLocalDB.role_id]
        )

        return NextResponse.json({message : "ok", result}, {status : 200})
        
    } catch {
        return NextResponse.json({message : "Internal Server Error"} , {status : 200})
    }
}