import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [result] = await db.query(
            "SELECT * FROM status"
        )
        return NextResponse.json({ message: "ok", result }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

// export async function POST(request) {
//     try {
//         const body = await request.json()
//         const { status_name } = body

//         if (!status_name) {
//             return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
//         }

//         const [rows] = await db.query(
//             "SELECT * FROM status WHERE status_name", [status_name]
//         )

//         if (rows >= 1) {
//             return NextResponse.json({ message: "มีสถานะนี้ในฐานข้อมูลอยู่แล้ว" }, { status: 400 })
//         }

//         await db.query(
//             "INSERT INTO status (status_name) VALUES (?)", [status_name]
//         )

//         return NextResponse.json({ message: "ok" }, { status: 200 })

//     } catch (e) {
//         return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

//     }
// }

export async function POST(request) {
  try {
    const body = await request.json();
    const rId = Number(body?.report_id);
    const sId = Number(body?.status_id);

    // ถ้าไม่เป็นตัวเลข ให้ 400 ทันที
    if (!Number.isFinite(rId) || !Number.isFinite(sId)) {
      return NextResponse.json(
        { message: "โปรดกรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      "SELECT * FROM report_status WHERE report_id = ?",
      [rId]
    );

    if (rows.length >= 1) {
      await db.query(
        "UPDATE report_status SET status_id = ? WHERE report_id = ?",
        [sId, rId]
      );
      return NextResponse.json({ message: "ok" }, { status: 200 });
    }

    await db.query(
      "INSERT INTO report_status (report_id, status_id) VALUES (?, ?)",
      [rId, sId]
    );

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function PATCH(request) {
    try {
        const body = await request.json()
        const {status_id, status_name } = body
        if (!status_name) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM status WHERE status_id = ?", [status_id]
        )

        if (rows.length == 0){
            return NextResponse.json({message : "ไม่พบข้อมูลในฐานข้อมูล"}, {status : 400})
        }

        await db.query(
            "UPDATE status SET status_name = ? WHERE status_id = ?", [status_name, status_id]
        )
        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch (e) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}