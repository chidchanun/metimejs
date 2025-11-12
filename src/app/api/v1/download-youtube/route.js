import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

    // ตัด query string อื่น ๆ ออกจาก YouTube URL
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
      url = `https://www.youtube.com/watch?v=${videoId}`;
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // สร้างโฟลเดอร์ uploads ถ้าไม่มี
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const outputFile = path.join(uploadDir, `song_${timestamp}.mp3`);

    // Path ของ yt-dlp และ ffmpeg
    const ytDlpPath = path.join(process.cwd(), "node_modules/yt-dlp-exec/bin/yt-dlp.exe");
    const ffmpegPath = path.join(process.cwd(), "ffmpeg/bin/ffmpeg.exe");

    // 1️⃣ ดึง metadata เพื่อเอา thumbnail URL
    const metadata = await new Promise((resolve, reject) => {
      const args = [`"${url}"`, "--skip-download", "--print-json"];
      const yt = spawn(ytDlpPath, args, { shell: true });

      let jsonOutput = "";
      yt.stdout.on("data", (data) => { jsonOutput += data.toString(); });
      yt.stderr.on("data", (data) => console.error(data.toString()));

      yt.on("close", (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(jsonOutput);
            resolve(info);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });
    });

    const thumbnailUrl = metadata.thumbnail;

    // 2️⃣ ดาวน์โหลด mp3
    await new Promise((resolve, reject) => {
      const args = [
        `"${url}"`,
        "--extract-audio",
        "--audio-format", "mp3",
        "--output", `"${outputFile}"`,
        "--ffmpeg-location", `"${ffmpegPath}"`,
        "--prefer-free-formats",
        "--no-check-certificates",
        "--no-warnings"
      ];

      const yt = spawn(ytDlpPath, args, { shell: true });

      yt.stdout.on("data", (data) => console.log(data.toString()));
      yt.stderr.on("data", (data) => console.error(data.toString()));

      yt.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp exited with code ${code}`));
      });
    });

    const songUrl = `/uploads/song_${timestamp}.mp3`;

    return NextResponse.json({
      message: "ok",
      song_url: songUrl,
      thumbnail_url: thumbnailUrl
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
