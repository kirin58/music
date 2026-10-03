import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tracks } from "@/lib/schema";
import { desc, like, or, sql } from "drizzle-orm";
import { uid } from "@/lib/utils";
import { getUserId } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const genre = searchParams.get("genre") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  try {
    let rows;
    if (q) {
      const pattern = `%${q}%`;
      rows = await db
        .select()
        .from(tracks)
        .where(or(like(tracks.title, pattern), like(tracks.artist, pattern), like(tracks.album, pattern)))
        .orderBy(desc(tracks.plays))
        .limit(limit);
    } else if (genre) {
      const { eq } = await import("drizzle-orm");
      rows = await db
        .select()
        .from(tracks)
        .where(eq(tracks.genre, genre))
        .orderBy(desc(tracks.createdAt))
        .limit(limit);
    } else {
      rows = await db.select().from(tracks).orderBy(desc(tracks.createdAt)).limit(limit);
    }
    return NextResponse.json({ tracks: rows });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: "DB not configured" }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "ล็อกอินก่อนโพสต์เพลง" }, { status: 401 });
  try {
    const body = await req.json();
    const { title, artist, album, genre, coverUrl, audioUrl, duration, source, youtubeId, spotifyId } = body;
    if (!title || !artist || !audioUrl) {
      return NextResponse.json({ error: "title, artist, audioUrl จำเป็น" }, { status: 400 });
    }
    const id = uid("trk");
    await db.insert(tracks).values({
      id,
      title: String(title).slice(0, 200),
      artist: String(artist).slice(0, 200),
      album: album ? String(album).slice(0, 200) : null,
      genre: genre ? String(genre).slice(0, 50) : null,
      coverUrl: coverUrl ?? null,
      audioUrl: String(audioUrl),
      source: ["upload", "external", "youtube", "spotify"].includes(source) ? source : "upload",
      youtubeId: youtubeId ?? null,
      spotifyId: spotifyId ?? null,
      duration: Number(duration ?? 0),
      plays: 0,
      userId
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ เช็ค TURSO_DATABASE_URL" }, { status: 500 });
  }
}
