import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import fs from "fs";
import path from "path";
import { parseFile } from "music-metadata";

export async function GET() {
    try {
        const [res] = await db.query(
            "SELECT * FROM song"
        )

        return NextResponse.json({ message: "ok", res }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const song_name = formData.get("song_name");
        const file = formData.get("file"); // File object
        const token = formData.get("token");
        const cover_file = formData.get("cover_file");

        if (!token) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
        }
        if (!song_name || !file) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        // ตรวจสอบ token และ role
        const [rows] = await db.query("SELECT * FROM user_tokens WHERE token = ?", [token]);
        if (rows.length === 0) {
            return NextResponse.json({ message: "โปรดเข้าสู่ระบบใหม่อีกครั้ง" }, { status: 400 });
        }

        const UserTokenLocalDB = rows[0];
        const [row_users] = await db.query("SELECT * FROM users WHERE id = ?", [UserTokenLocalDB.user_id]);
        const UserLocalDB = row_users[0];

        if (UserLocalDB.role_id !== 3) {
            return NextResponse.json({ message: "ไม่มีสิทธิ์ในการเข้าใช้งาน" }, { status: 400 });
        }

        // เตรียมโฟลเดอร์เก็บไฟล์
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        // บันทึกเพลง
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const songFileName = Date.now() + "_" + file.name;
        const songPath = path.join(uploadDir, songFileName);
        fs.writeFileSync(songPath, fileBuffer);
        const song_url = `/uploads/${songFileName}`;

        // อ่าน duration ของเพลง
        let song_duration = 0;
        try {
            const metadata = await parseFile(songPath);
            song_duration = Math.floor(metadata.format.duration || 0); // วินาที
        } catch (err) {
            console.log("Error reading song metadata:", err);
        }

        console.log(song_duration)

        // บันทึก cover ถ้ามี
        let cover_url = null;
        if (cover_file && cover_file.size > 0) {
            const reader = cover_file.stream().getReader();
            const { value } = await reader.read();
            const buffer = Buffer.from(value);
            const coverFileName = Date.now() + "_cover_" + cover_file.name;
            const coverPath = path.join(uploadDir, coverFileName);
            fs.writeFileSync(coverPath, buffer);
            cover_url = `/uploads/${coverFileName}`;
        }

        // บันทึกลง DB
        await db.query(
            "INSERT INTO song (song_name, song_duration, song_url, cover_url) VALUES (?,?,?,?)",
            [song_name, song_duration, song_url, cover_url]
        );

        return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}