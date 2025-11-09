import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"

export async function GET(){
    try {
        const [res] = await db.query(
            "SELECT * FROM song"
        )

        return NextResponse.json({message : "ok", res}, {status : 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})

    }
}

export async function POST(request){
    try {
        const body = await request.json()
        const {song_name, song_duration, song_url, cover_url, token} = body

        if (!token) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (rows.length == 0) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const UserTokenLocalDB = rows[0]

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (!song_name || !song_duration || !song_url || !cover_url) {
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"}, {status : 400})
        }


        return NextResponse.json({message : "ok"}, {status : 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})

    }
}