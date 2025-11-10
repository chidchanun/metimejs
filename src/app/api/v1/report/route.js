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
    console.error("[/report GET] DB Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      description,
      problem_where,
      problem_type,
      problem_severe,
      image_url,
      reported_at,    // <-- รับมาจาก client
      token
    } = body;

    if (!token) {
      return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT * FROM user_tokens WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
    }

    const userToken = rows[0];
    const expiresTime = new Date(userToken.token_expires).getTime();
    if (expiresTime < Date.now()) {
      return NextResponse.json({ message: "หมดเวลาใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
    }

    const [row_users] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userToken.user_id]
    );

    if (row_users.length === 0) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้งาน โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
    }

    if (!description || !problem_type || !problem_severe) {
      return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // --- ตรวจและเตรียม reported_at จาก client ---
    let reportedAtParam = null;

    if (reported_at) {
    // ตัดทุกอย่างหลัง "T" เพื่อเหลือแค่ YYYY-MM-DD
    const dateOnly = reported_at.split("T")[0];

    // ตรวจว่ารูปแบบวันที่ถูก
    const onlyDate = /^\d{4}-\d{2}-\d{2}$/;
    if (onlyDate.test(dateOnly)) {
        reportedAtParam = `${dateOnly} 00:00:00`;
    }
    }




    // ใช้ COALESCE ให้ DB ใส่ NOW(3) เมื่อ client ไม่ส่งเวลามา
    const [result] = await db.query(
      `INSERT INTO report
        (description, problem_where, problem_type, problem_severe, image_url, reported_at)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW(3)))`,
      [
        description,
        problem_where || null,
        problem_type,
        problem_severe,
        image_url || null,
        reportedAtParam
      ]
    );

    const insertedId = result.insertId;

    await db.query(
      "INSERT INTO user_report (user_id, report_id) VALUES (?, ?)",
      [row_users[0].id, insertedId]
    );

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[/report POST] Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
