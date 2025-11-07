import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET() {
    try {
        const [result] = await db.query(
            "SELECT * FROM problem_type"
        )
        return NextResponse.json({ message: "ok", result }, { status: 200 })
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { problemType_name } = body

        if (!problemType_name) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM problem_type WHERE problemType_name = ?", [problemType_name]
        )

        if (rows.length >= 1) {
            return NextResponse.json({ message: "หัวข้อปัญหานี้ในฐานข้อมูลอยู่แล้ว" }, { status: 400 })
        }

        await db.query(
            "INSERT INTO problem_type (problemType_name) VALUES (?)", [problemType_name]
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
        const {problemType_id ,problemType_name } = body

        if (!problemType_id) {
            return NextResponse.json({ message: "โปรดกรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
        }

        const [rows] = await db.query(
            "SELECT * FROM problem_type WHERE problemType_id = ?", [problemType_id]
        )

        if (rows.length == 0) {
            return NextResponse.json({ message: "ไม่พบหัวข้อปัญหานี้ในฐานข้อมูล" }, { status: 400 })
        }

        await db.query(
            "UPDATE problem_type SET problemType_name = ? WHERE problemType_id = ?", [problemType_name, problemType_id]
        )

        return NextResponse.json({ message: "ok" }, { status: 200 })

    } catch (e) {
        console.log(e)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })

    }
}
