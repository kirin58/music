import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { uid } from "@/lib/utils";

/** สมัครสมาชิกด้วยอีเมล + รหัสผ่าน */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    const cleanEmail = String(email ?? "").toLowerCase().trim();
    const cleanName = String(name ?? "").trim().slice(0, 80) || cleanEmail.split("@")[0];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
    }
    if (String(password ?? "").length < 6) {
      return NextResponse.json({ error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    const exists = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (exists[0]) {
      return NextResponse.json({ error: "อีเมลนี้สมัครแล้ว ไปหน้าล็อกอิน" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const id = uid("usr");
    await db.insert(users).values({
      id,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      provider: "credentials"
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "สมัครไม่สำเร็จ เช็ค TURSO_*" }, { status: 500 });
  }
}
