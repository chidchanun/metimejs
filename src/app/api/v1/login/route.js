import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { db } from "@/app/lib/db";


const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key"; // เก็บใน .env

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "โปรดกรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const [userRows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    const user = userRows[0];
    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้งานหรือรหัสผ่านผิด" },
        { status: 400 }
      );
    }

    await db.query

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
