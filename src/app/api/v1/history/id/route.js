import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const { room_id } = body

        if (!room_id) {
            return NextResponse.json({ message: "ไม่พบห้องสนทนา" }, { status: 400 })
        }

        const [row_room] = await db.query(
            "SELECT * FROM room WHERE room_id = ?", [room_id]
        )

        if (row_room.length == 0) {
            return NextResponse.json({ message: "ไม่พบห้องสนทนา" }, { status: 400 })
        }

        const roomData = row_room[0]

        const [result] = await db.query(
            `SELECT 
                h.history_id,
                h.message,
                h.room_id,
                h.user_id,
                h.created_at,
                u.role_id,
                r.role_name
            FROM history h
            JOIN users u ON h.user_id = u.id
            JOIN role r ON u.role_id = r.role_id
            WHERE h.room_id = ?
            ORDER BY h.created_at ASC;
            `, [room_id]
        )

        return NextResponse.json({ message: "ok" , result}, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}