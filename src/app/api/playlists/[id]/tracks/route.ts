import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlistTracks } from "@/lib/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { trackId } = await req.json();
    if (!trackId) return NextResponse.json({ error: "trackId จำเป็น" }, { status: 400 });
    await db
      .insert(playlistTracks)
      .values({ playlistId: params.id, trackId })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "เพิ่มเพลงไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { trackId } = await req.json();
    const { and, eq } = await import("drizzle-orm");
    await db
      .delete(playlistTracks)
      .where(
        and(eq(playlistTracks.playlistId, params.id), eq(playlistTracks.trackId, trackId))
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
