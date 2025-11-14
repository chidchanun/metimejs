import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const { token, student_id } = body

        if (!student_id) {
            return NextResponse.json({ meesage: "ไม่พบแชทของนักศึกษา" }, { status: 400 })
        }

        if (!token) {
            return NextResponse.json({ meesage: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 })
        }

        const [row_teacher] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ? ", [token]
        )

        if (row_teacher.length == 0) {
            return NextResponse.json({ meesage: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 })
        }

        const teacherToken = await row_teacher.json()

        const [teacher] = await db.query(
            "SELECT * FROM users WHERE id = ?", [teacherToken.user_id]
        )

        const teacherData = await teacher.json()

        if (teacherData.role_id === 1) {
            return NextResponse.json({ meesage: "ไม่มีสิทธิ์ในการใช้งาน" }, { status: 403 })

        }

        await db.query(
            "INSERT INTO room (student_id, teacher_id) VALUES (?,?)", [student_id, teacherData.id]
        )
        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}