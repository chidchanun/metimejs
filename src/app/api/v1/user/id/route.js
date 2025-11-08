import {NextResponse} from "next/server"
import { db } from "@/app/lib/db"


export async function POST(request){
    try {
        const body = await request.json()
        const {token} = body
        if (!token) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (rows.length == 0){
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const UserTokenLocalDB = rows[0]

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (row_users.length == 0) {
            return NextResponse.json({message : "ไม่พบผู้ใช้ โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const UserLocalDB = row_users[0]

        return NextResponse.json({message : "ok", UserLocalDB}, {status: 200})

    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 400})
    }
}

export async function PATCH(request){
    try {
        const body = await request.json()
        const {fname, lname, token} = body

        if (!token) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        if (!fname && !lname) {
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"}, {status : 400})
        }

        const [rows] = await db.query(
            "SELECT * FROM user_tokens WHERE token = ?", [token]
        )

        if (rows.length == 0){
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const UserTokenLocalDB = rows[0]

        const [row_users] = await db.query(
            "SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]
        )

        if (row_users.length == 0) {
            return NextResponse.json({message : "ไม่พบผู้ใช้ โปรดเข้าสู่ระบบใหม่อีกครั้ง"}, {status : 400})
        }

        const UserLocalDB = row_users[0]

        if (fname && lname){
            await db.query(
                "UPDATE users SET fname = ?, lname = ? WHERE id = ?" , [fname, lname, UserLocalDB.id]
            )
        } else if (fname) {
            await db.query(
                "UPDATE users SET fname = ?, lname = ? WHERE id = ?" , [fname, UserLocalDB.lname, UserLocalDB.id]
            )
        } else if (lname) {
            await db.query(
                "UPDATE users SET fname = ?, lname = ? WHERE id = ?" , [UserLocalDB.fname, lname, UserLocalDB.id]
            )
        }

        return NextResponse.json({message : "ok"}, {status: 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 400})

    }
}