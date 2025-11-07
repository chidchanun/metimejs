import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET() {
    try {
        const [result] = await db.query(`
        SELECT 
            rs.reportStatus_id,
            r.report_id AS report_id,
            r.description AS description,
            r.problem_where AS problem_where,
            r.image_url AS image_url,
            r.reported_at AS reported_at,
            s.status_id AS status_id,
            s.status_name AS status_name
        FROM report_status rs
        LEFT JOIN report r ON rs.report_id = r.report_id
        LEFT JOIN status s ON rs.status_id = s.status_id
        ORDER BY rs.reportStatus_id DESC
        `);
        return NextResponse.json({ message: "ok", result }, { status: 200 })
    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 400 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const {report_id, status_id} = body

        if (!report_id || !status_id){
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"})
        }

        const [rows] = await db.query(
            "SELECT * FROM report_status WHERE report_id = ?", [report_id]
        )

        if (rows.length == 1){
            const report_statusDB = rows[0]
            await db.query(
                "UPDATE report_status SET status_id = ? WHERE report_id = ?" , [status_id, report_statusDB.report_id] 
            )
            return NextResponse.json({message : "ok"}, {status : 200})
        }

        await db.query(
            "INSERT INTO report_status (report_id, status_id) VALUES (?,?)", [report_id, status_id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 400 })
    }
}