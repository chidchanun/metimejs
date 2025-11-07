import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request) {
    try {
        const body = await request.json()
        const {title , description, problem_where, problem_type , problem_severe, image_url} = body

        if (!title || !description || !problem_type || !problem_severe) {
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"}, {status : 400})
        }

        

        return NextResponse.json({message : "ok"}, {status : 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})
    }
}