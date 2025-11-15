import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"

export async function POST(request) {
    try {
        const body = await request.json()
        const {token} = body

        if (!token) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 401})
        }

        const [row] = await db.query(
            "SELECT * FROM user_token WHERE token = ?", [token]
        )

        if (row.length == 0){
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 401})
        }

        const UserTokenLocalDB = row[0]

        const [row_user] = await db.query(
            "SELECT * FROM users WHERE id = ?" , [UserTokenLocalDB.user_ud]
        )

        if (row_user.length == 0) {
            return NextResponse.json({message : "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        
    } catch {

    }
}