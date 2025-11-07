import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request){
    try {
        const body = await request.json()
        const {token} = body

        if (!token) {
            return NextResponse.json({message : "โปรดเข้าสู่ระบบใหม่อีกครั้ง"} , {status : 200})
        }

        
    } catch {

    }
}