import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request){
    try {
        const body = await request.json()
        const { emotion_name } = body

        if (!emotion_name) {
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"}, {status : 400})
        }

        const [rows] = await db.query(
            "SELECT * FROM emotion WHERE emotion_name = ?" , [emotion_name]
        )

        if (rows.length >= 1) {
            return NextResponse.json({message : "มีความรู้สึกนี้ อยู่ในฐานข้อมูลเรียบร้อยแล้ว"}, {status : 400})
        }

        await db.query(
            "INSERT INTO emotion (emotion_name) VALUES (?)", [emotion_name]
        )

        return NextResponse.json({message : "ok"}, {status : 200})
    } catch (e) {
        console.log(e)
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})
    }
}