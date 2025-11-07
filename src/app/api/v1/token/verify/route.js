import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const expiresInSeconds = 60 * 60 * 2; // 2 ชั่วโมง
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "โปรดล็อกอินเข้าสู่ระบบ" },
        { status: 400 }
      );
    }

    // 🔍 ตรวจสอบ token จากฐานข้อมูล
    const [rows] = await db.query("SELECT * FROM user_tokens WHERE token = ?", [
      token,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "โปรดล็อกอินเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    const tokenLocalDB = rows[0];

    // 🕒 ตรวจสอบเวลาหมดอายุ
    const expiresTime = new Date(tokenLocalDB.token_expires).getTime();
    const now = Date.now();

    if (expiresTime < now) {
      // token หมดอายุ
      return NextResponse.json(
        { message: "โปรดล็อกอินเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    // 🔄 ต่ออายุ token (refresh expiration)
    await db.query(
      "UPDATE user_tokens SET updated_at = NOW(), token_expires = ? WHERE token = ?",
      [expiresAt, token]
    );

    return NextResponse.json(
      { message: "Token verified", newExpiresAt: expiresAt },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
