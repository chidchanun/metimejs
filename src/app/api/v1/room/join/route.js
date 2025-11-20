import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const { token, room_id } = await body

        if (!token) return NextResponse.json({ message: "ไม่พบข้อมูลของคุณ" }, { status: 401 })
        if (!room_id) return NextResponse.json({ message: "ไม่พบห้องสนทนา" }, { status: 400 })

        const [rowRoom] = await db.query(
            "SELECT * FROM room WHERE room_id = ?", [room_id]
        )

        const RoomData = rowRoom[0]

        if (RoomData.teacher_id) {
            return NextResponse.json({ message: "มีอาจารย์เข้าห้องสนทนาแล้ว" }, { status: 400 })
        }

        const [rowToken] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        const UserToken = rowToken[0]

        if (!UserToken) return NextResponse.json({ message: "ไม่พบข้อมูลของคุณ" }, { status: 401 })

        const [rowUser] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserToken.user_id]
        )

        const UserData = rowUser[0]

        if (!UserData) return NextResponse.json({ message: "ไม่พบข้อมูลของคุณ" }, { status: 400 })

        if (UserData.role_id !== 2) return NextResponse.json({ message: "ไม่สิทธิ์ในการเข้าถึง" }, { status: 403 })

        await db.query(
            "UPDATE room SET teacher_id = ? WHERE room_id = ?", [UserData.id, room_id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })

    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}