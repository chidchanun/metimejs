import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET() {
    try {
        const [result] = await db.query(`
      SELECT 
        r.report_id,
        r.description,
        r.problem_where,
        r.image_url,
        r.reported_at,
        pt.problemType_name AS problem_type,
        ps.problemSevere_name AS problem_severe
      FROM report r
      LEFT JOIN problem_type pt ON r.problem_type = pt.problemType_id
      LEFT JOIN problem_severe ps ON r.problem_severe = ps.problemSevere_id
      ORDER BY r.report_id DESC
    `);

        return NextResponse.json({ message: "ok", result }, { status: 200 });
    } catch (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { description, problem_where, problem_type, problem_severe, image_url, reported_at, token } = body

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

        if (!description || !problem_type || !problem_severe) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [result] = await db.query(
            "INSERT INTO report (description, problem_where, problem_type, problem_severe, image_url, reported_at) VALUES ( ?, ?, ?, ?, ?, ?)",
            [description, problem_where, problem_type, problem_severe, image_url, reported_at]
        );

        const insertedId = result.insertId;

        await db.query(
            "INSERT INTO user_report (user_id, report_id) VALUES (?,?)", [UserLocalDB.id, insertedId]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}
