import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json();
        const { token, student_id } = body;

        if (!student_id) {
            return NextResponse.json({ message: "ไม่พบรหัสนักศึกษา" }, { status: 400 });
        }
        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 });
        }

        const [rowToken] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?",
            [token]
        );
        const teacher_id = rowToken[0]?.user_id;
        if (!teacher_id) return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });

        const [rowTeacher] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [teacher_id]
        );
        const teacher = rowTeacher[0];
        if (!teacher || teacher.role_id !== 2) {
            return NextResponse.json({ message: "ไม่มีสิทธิ์ในการใช้งาน" }, { status: 403 });
        }

        const [existRoom] = await db.query(
            "SELECT * FROM room WHERE student_id = ? AND teacher_id = ?",
            [student_id, teacher.id]
        );
        console.log(existRoom)

        if (existRoom.length > 0) {
            return NextResponse.json({
                message: "มีห้องแชทนี้อยู่แล้ว",
                room_id: existRoom[0].room_id,
            }, { status: 200 });
        }

        const [insert] = await db.query(
            "INSERT INTO room (student_id, teacher_id) VALUES (?, ?)",
            [student_id, teacher.id]
        );

        return NextResponse.json({
            message: "สร้างห้องเรียบร้อย",
            room_id: insert.insertId,
        }, { status: 200 });

    } catch (err) {
        console.error("❌ Error:", err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request){
    try {
        const body = await request.json()
        const {token} = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 });
        }

        const [row_token] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )
    } catch {

    }
}