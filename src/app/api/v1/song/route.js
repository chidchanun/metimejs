import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // Node.js <18, ถ้า Next.js 13+ ใช้ global fetch ได้เลย

export async function GET(){
  try {
    const [res] = await db.query(
      "SELECT * FROM song"
    )
    return NextResponse.json({message : "ok", res}, {status : 200})
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });

  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const song_name = formData.get("song_name");
    const file = formData.get("file");
    const song_url_input = formData.get("song_url");
    const cover_file = formData.get("cover_file");
    const thumbnail_url_input = formData.get("thumbnail_url");
    const token = formData.get("token");

    if (!token) return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
    if (!song_name || (!file && !song_url_input)) return NextResponse.json({ message: "กรุณาใส่ชื่อเพลงและไฟล์หรือ URL" }, { status: 400 });

    // ตรวจสอบ token และ role
    const [rows] = await db.query("SELECT * FROM user_tokens WHERE token = ?", [token]);
    if (rows.length === 0) return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });

    const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [rows[0].user_id]);
    const user = userRows[0];
    if (user.role_id !== 3) return NextResponse.json({ message: "ไม่มีสิทธิ์ในการเข้าใช้งาน" }, { status: 403 });

    // สร้างโฟลเดอร์ uploads และ uploads/thumbnail
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const thumbDir = path.join(uploadDir, "thumbnail");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    // บันทึกเพลง
    let song_url;
    if (file && file.size > 0) {
      const songBuffer = Buffer.from(await file.arrayBuffer());
      const songFileName = Date.now() + "_" + file.name.replace(/[<>:"/\\|?*&]/g, "_");
      const songPath = path.join(uploadDir, songFileName);
      fs.writeFileSync(songPath, songBuffer);
      song_url = `/uploads/${songFileName}`;
    } else if (song_url_input) {
      song_url = song_url_input;
    }

    // บันทึก cover
    let cover_url = null;
    if (cover_file && cover_file.size > 0) {
      const coverBuffer = Buffer.from(await cover_file.arrayBuffer());
      const coverFileName = Date.now() + "_cover_" + cover_file.name.replace(/[<>:"/\\|?*&]/g, "_");
      const coverPath = path.join(uploadDir, coverFileName);
      fs.writeFileSync(coverPath, coverBuffer);
      cover_url = `/uploads/${coverFileName}`;
    }

    // ✅ ดาวน์โหลด thumbnail จาก URL
    let thumbnail_url = null;
    if (thumbnail_url_input) {
      const ext = path.extname(new URL(thumbnail_url_input).pathname) || ".jpg";
      const thumbFileName = Date.now() + "_thumb" + ext;
      const thumbPath = path.join(thumbDir, thumbFileName);

      // fetch + stream ลงไฟล์โดยตรง
      const res = await fetch(thumbnail_url_input, {
        headers: {
          "User-Agent": "Mozilla/5.0", // บาง URL ต้องมี UA
        },
        redirect: "follow"
      });
      if (!res.ok) throw new Error("Failed to download thumbnail");

      const fileStream = fs.createWriteStream(thumbPath);
      await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
      });

      thumbnail_url = `/uploads/thumbnail/${thumbFileName}`;
    }

    // บันทึกลง DB
    await db.query(
      "INSERT INTO song (song_name, song_duration, song_url, cover_url, thumbnail_url) VALUES (?,0,?,?,?)",
      [song_name, song_url, cover_url, thumbnail_url]
    );

    return NextResponse.json({ message: "ok", song_url, cover_url, thumbnail_url }, { status: 200 });

  } catch (e) {
    console.log("❌ ERROR POST:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
