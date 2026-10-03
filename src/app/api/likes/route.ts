import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { likes, tracks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { uid } from "@/lib/utils";

const demoUser = () => process.env.DEMO_USER_ID ?? "demo-user-1";

export async function GET() {
  try {
    const rows = await db
      .select({ track: tracks })
      .from(likes)
      .innerJoin(tracks, eq(likes.trackId, tracks.id))
      .where(eq(likes.userId, demoUser()));
    return NextResponse.json({ tracks: rows.map((r) => r.track) });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    if (!trackId) return NextResponse.json({ error: "trackId จำเป็น" }, { status: 400 });
    await db.insert(likes).values({ userId: demoUser(), trackId }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "like ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    const { and } = await import("drizzle-orm");
    await db
      .delete(likes)
      .where(and(eq(likes.userId, demoUser()), eq(likes.trackId, trackId)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unlike ไม่สำเร็จ" }, { status: 500 });
  }
}
