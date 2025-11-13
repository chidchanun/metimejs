// app/api/v1/user-report/route.js
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // token จาก header: "Authorization: Bearer xxx" หรือจาก query ?token=xxx
    const auth = request.headers.get("authorization") || "";
    const tokenFromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const token = tokenFromHeader || searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "โปรดล็อกอินเข้าสู่ระบบ" }, { status: 400 });
    }

    // ตรวจสอบ token
    const [rows] = await db.query("SELECT * FROM user_tokens WHERE token = ?", [token]);
    if (rows.length === 0) {
      return NextResponse.json({ message: "โปรดล็อกอินใหม่อีกครั้ง" }, { status: 401 });
    }
    const tokenRow = rows[0];
    if (new Date(tokenRow.token_expires).getTime() < Date.now()) {
      return NextResponse.json({ message: "หมดเวลาใช้งาน โปรดล็อกอินใหม่" }, { status: 401 });
    }

    // ดึงรายการรายงานของ user นี้ (join user_report -> report + type/severity)
    const [result] = await db.query(`
      SELECT
        r.report_id,
        r.description,
        r.problem_where,
        r.image_url,
        r.reported_at,
        pt.problemType_name AS problem_type,
        ps.problemSevere_name AS problem_severe,
        s.status_name AS status
      FROM user_report ur
      JOIN report r ON ur.report_id = r.report_id
      LEFT JOIN problem_type pt ON r.problem_type = pt.problemType_id
      LEFT JOIN problem_severe ps ON r.problem_severe = ps.problemSevere_id
      LEFT JOIN report_status rs ON rs.report_id = r.report_id
      LEFT JOIN status s ON rs.status_id = s.status_id
      WHERE ur.user_id = ?
      ORDER BY r.report_id DESC
    `, [tokenRow.user_id]);
      console.log(result)
    return NextResponse.json({ message: "ok", result }, { status: 200 });
  } catch (e) {
    console.error("[/user-report GET] Error:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
