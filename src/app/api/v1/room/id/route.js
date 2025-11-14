import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json();
        const { token } = body

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 401 });
        }

        const [rowToken] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?",
            [token]
        );
        const user_id = rowToken[0]?.user_id;
        if (!user_id) return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?", [user_id]
        )

        const userData = row_user[0]
        const [row_room] = await db.query(
            "SELECT * FROM room WHERE student_id = ?", [userData.id]
        )

        if (row_room.length === 0){
            return NextResponse.json({ message: "ไม่พบห้องสนทนา" }, { status: 400 });
        }


        return NextResponse.json({message : "ok", row_room}, {status : 200})

    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}