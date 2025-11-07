import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET() {
    try {
        const [result] = await db.query(
            "SELECT * FROM problem_severe"
        )
        return NextResponse.json({ message: "ok", result }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { problemSevere_name } = body

        if (!problemSevere_name) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM problem_severe WHERE problemSevere_name = ?", [problemSevere_name]
        )

        if (rows.length >= 1) {
            return NextResponse.json({ message: "หัวข้อปัญหานี้ในฐานข้อมูลอยู่แล้ว" }, { status: 400 })
        }

        await db.query(
            "INSERT INTO problem_severe (problemSevere_name) VALUES (?)", [problemSevere_name]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })

    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}

export async function PATCH(request) {
    try {
        const body = await request.json()
        const {problemSevere_id ,problemSevere_name } = body

        if (!problemSevere_id) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM problem_severe WHERE problemSevere_id = ?", [problemSevere_id]
        )

        if (rows.length == 0) {
            return NextResponse.json({ message: "ไม่พบหัวข้อปัญหานี้ในฐานข้อมูล" }, { status: 400 })
        }

        await db.query(
            "UPDATE problem_severe SET problemSevere_name = ? WHERE problemSevere_id = ?", [problemSevere_name, problemSevere_id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })

    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}
