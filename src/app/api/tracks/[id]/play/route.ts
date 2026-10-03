import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tracks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .update(tracks)
      .set({ plays: sql`${tracks.plays} + 1` })
      .where(eq(tracks.id, params.id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
