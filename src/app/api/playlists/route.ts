import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlists } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { uid } from "@/lib/utils";

const demoUser = () => process.env.DEMO_USER_ID ?? "demo-user-1";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, demoUser()))
      .orderBy(desc(playlists.createdAt));
    return NextResponse.json({ playlists: rows });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, isPublic } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "ใส่ชื่อเพลย์ลิสต์" }, { status: 400 });
    const id = uid("pl");
    await db.insert(playlists).values({
      id,
      name: String(name).slice(0, 120),
      description: description ?? null,
      userId: demoUser(),
      isPublic: isPublic === 0 ? 0 : 1
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "สร้างเพลย์ลิสต์ไม่สำเร็จ" }, { status: 500 });
  }
}
