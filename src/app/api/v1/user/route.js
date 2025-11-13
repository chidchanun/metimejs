import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function GET(){
    try {
        const [result] = await db.query(
            "SELECT * FROM users"
        )
        return NextResponse.json({message : "ok", result}, {status : 200})
    } catch {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})
    }
}