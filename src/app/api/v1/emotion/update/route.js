import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function POST(request){
    try {
        const body = await request.json()
        const {emotion_name, updateEmotion_name} = body
        
        if (!emotion_name || !updateEmotion_name) {
            return NextResponse.json({message : "โปรดกรอกข้อมูลให้ครบถ้วน"}, {status : 400})
        }

        const [rows] = await db.query(
            "SELECT * FROM emotion WHERE emotion_name = ? " , [emotion_name]
        )
        if (rows.length == 0){
            return NextResponse.json({message : "ไม่พบข้อมูล"} , {status : 400})
        }

        const emotion_nameDB = rows[0]

        await db.query(
            "UPDATE emotion SET emotion_name = ? WHERE emotion_id = ?" , [updateEmotion_name, emotion_nameDB.emotion_id] 
        )   
      
        return NextResponse.json({message : "ok"}, {status : 200})
    } catch  {
        return NextResponse.json({message : "Internal Server Error"}, {status : 500})
    }
}