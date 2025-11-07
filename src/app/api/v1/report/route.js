import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const { title, description, problem_where, problem_type, problem_severe, image_url, reported_at , token } = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (rows.lenght == 0) {
            return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const UserTokenLocalDB = rows[0]
        const expiresTime = new Date(UserTokenLocalDB.token_expires).getTime()

        if (expiresTime < Date.now()) {
            return NextResponse.json({ message: "หมดเวลาใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (row_users.lenght == 0) {
            return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const UserLocalDB = row_users[0]

        if (!title || !description || !problem_type || !problem_severe) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [result] = await db.query(
            "INSERT INTO report (title, description, problem_where, problem_type, problem_severe, image_url, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, description, problem_where, problem_type, problem_severe, image_url, reported_at]
        );

        const insertedId = result.insertId;

        await db.query(
            "INSERT INTO user_report (user_id, report_id) VALUES (?,?)" , [UserLocalDB.id, insertedId]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}

export async function GET(){
    try {

        const [result] = await db.query(
            "SELECT * FROM report"
        )

        return NextResponse.json({message : "ok", result}, {status : 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})
    }
}