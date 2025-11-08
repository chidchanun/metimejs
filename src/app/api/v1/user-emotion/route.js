import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { getUserIdFromToken } from "@/app/utils/getUserIdFromToken";

export async function GET(req) {
  const user_id = await getUserIdFromToken();
  if (!user_id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 7); // default 7

  try {
    const [rows] = await db.execute(
      `
      SELECT ue.created_at, e.emotion_id, e.emotion_name
      FROM user_emotion ue
      JOIN emotion e ON ue.emotion_id = e.emotion_id
      WHERE ue.user_id = ?
        AND ue.created_at >= NOW() - INTERVAL ? DAY
      ORDER BY ue.created_at ASC
      `,
      [user_id, days]
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }
}

