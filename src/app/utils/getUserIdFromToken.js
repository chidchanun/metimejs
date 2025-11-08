import { cookies } from "next/headers";
import { db } from "@/app/lib/db";

export async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value; // ต้องเป็นชื่อเดียวกับ cookie ที่เซ็ตตอน login

  if (!token) return null;

  // หา user จาก token
  const [rows] = await db.execute(
    `SELECT user_id FROM user_tokens WHERE token = ? LIMIT 1`,
    [token]
  );

  if (rows.length === 0) return null;

  return rows[0].user_id;
}
