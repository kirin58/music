import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlists } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { uid } from "@/lib/utils";
import { getUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ playlists: [] });
  try {
    const rows = await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));
    return NextResponse.json({ playlists: rows });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "ล็อกอินก่อนสร้างเพลย์ลิสต์" }, { status: 401 });
  try {
    const { name, description, isPublic } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "ใส่ชื่อเพลย์ลิสต์" }, { status: 400 });
    const id = uid("pl");
    await db.insert(playlists).values({
      id,
      name: String(name).slice(0, 120),
      description: description ?? null,
      userId,
      isPublic: isPublic === 0 ? 0 : 1
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "สร้างเพลย์ลิสต์ไม่สำเร็จ" }, { status: 500 });
  }
}
