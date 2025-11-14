// app/api/v1/users-admin/route.js
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// ฟังก์ชันช่วย: เอา token → หา user เจ้าของ token
async function getUserFromToken(token) {
  const [rows] = await db.query(
    "SELECT * FROM user_tokens WHERE token = ?",
    [token]
  );
  if (rows.length === 0) return null;

  const tokenRow = rows[0];
  const expiresTime = new Date(tokenRow.token_expires).getTime();
  if (expiresTime < Date.now()) return null;

  const [users] = await db.query(
    "SELECT * FROM users WHERE id = ?",
    [tokenRow.user_id]
  );
  if (users.length === 0) return null;

  return users[0]; // มี field role_id อยู่ในนี้
}

// GET: ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin เท่านั้น)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    const me = await getUserFromToken(token);
    if (!me) {
      return NextResponse.json(
        { message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    // 👇 สมมติ role_id = 3 คือ admin (ปรับได้)
    if (me.role_id !== 3) {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 }
      );
    }

    const [rows] = await db.query(`
      SELECT
        id,
        role_id,
        username_code,
        fname,
        lname
      FROM users
      ORDER BY id ASC
    `);

    return NextResponse.json({ message: "ok", result: rows }, { status: 200 });
  } catch (e) {
    console.error("[/users-admin GET] Error:", e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: แก้ role ของ user คนไหนก็ได้ (เฉพาะ admin)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { token, user_id, role_id } = body;

    if (!token) {
      return NextResponse.json(
        { message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    if (!user_id || !role_id) {
      return NextResponse.json(
        { message: "โปรดระบุ user_id และ role_id" },
        { status: 400 }
      );
    }

    const me = await getUserFromToken(token);
    if (!me) {
      return NextResponse.json(
        { message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    // 👇 ให้เฉพาะ admin เปลี่ยนสิทธิ์คนอื่นได้
    if (me.role_id !== 3) {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เปลี่ยน role" },
        { status: 403 }
      );
    }

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      user_id,
    ]);
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    await db.query("UPDATE users SET role_id = ? WHERE id = ?", [
      role_id,
      user_id,
    ]);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (e) {
    console.error("[/users-admin PATCH] Error:", e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
