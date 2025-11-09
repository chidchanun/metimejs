import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// ฟังก์ชันดึงข้อมูลนักศึกษา
async function fetchStudent(studentCode) {
  try {
    const res = await fetch(`http://it.e-tech.ac.th/api/v1/student/${studentCode}`, {
      method: "GET",
    });

    const text = await res.text();
    console.log("Response Text:", text);

    try {
      return JSON.parse(text);
    } catch {
      console.error("Response is not valid JSON");
      return null;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// ✅ Route handler
export async function POST(request) {
  try {
    const body = await request.json();
    const expiresInSeconds = 60 * 60 * 2; // 2 ชั่วโมง
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const { studentCode, password, token } = body;
    let role_id = 0;

    if (!studentCode || !password) {
      return NextResponse.json(
        { error: "โปรดกรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    // ✅ ตรวจว่ามี user อยู่แล้วหรือยัง
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username_code = ?",
      [studentCode]
    );

    let userId;

    if (rows.length > 0) {
      // --- ผู้ใช้มีอยู่แล้ว ---
      const user = rows[0];
      userId = user.id;

      await db.query("DELETE FROM user_tokens WHERE user_id = ?", [userId]);
      await db.query(
        "INSERT INTO user_tokens (user_id, token, updated_at, token_expires) VALUES (?, ?, NOW(), ?)",
        [userId, token, expiresAt]
      );
    } else {
      // --- ผู้ใช้ใหม่ ---
      if (studentCode.length === 9) {
        role_id = 2; // อาจารย์
        const [insertResult] = await db.query(
          "INSERT INTO users (role_id, username_code) VALUES (?, ?)",
          [role_id, studentCode]
        );
        userId = insertResult.insertId;
      } else if (studentCode.length === 13) {
        role_id = 1; // นักศึกษา
        const studentData = await fetchStudent(studentCode);
        const student = studentData?.datas?.[0];

        if (!student) {
          return NextResponse.json(
            { error: "ไม่สามารถดึงข้อมูลนักศึกษาได้" },
            { status: 500 }
          );
        }

        const [insertResult] = await db.query(
          "INSERT INTO users (role_id, username_code, fname, lname) VALUES (?, ?, ?, ?)",
          [role_id, student.id_code, student.fname, student.lname]
        );
        userId = insertResult.insertId;
      }

      await db.query(
        "INSERT INTO user_tokens (user_id, token, updated_at, token_expires) VALUES (?, ?, NOW(), ?)",
        [userId, token, expiresAt]
      );
    }

    // ✅ สร้าง response เดียวเท่านั้น
    const response = NextResponse.json(
      {
        message: "Login Success",
        user: { id: userId, username: studentCode },
      },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "strict",
      path: "/",
      maxAge: expiresInSeconds,
    });

    return response;
  } catch (error) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
