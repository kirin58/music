import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tracks } from "@/lib/schema";
import { uid } from "@/lib/utils";
import { previewImport } from "@/lib/import-url";
import { getUserId } from "@/lib/current-user";

/** ดูลิงก์ก่อนบันทึก (โชว์ preview ให้ user แก้ชื่อได้) */
export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!url) return NextResponse.json({ error: "ส่ง ?url= มาด้วย" }, { status: 400 });
  const preview = await previewImport(url);
  if (preview.kind === "unknown") {
    return NextResponse.json(
      { error: "ลิงก์ไม่รองรับ — ใช้ YouTube, Spotify track, หรือลิงก์ไฟล์ .mp3 ตรง" },
      { status: 422 }
    );
  }
  return NextResponse.json({ preview });
}

/** บันทึกเพลงจากลิงก์เป็นของตัวเอง (ต้องล็อกอิน) */
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "ล็อกอินก่อนโพสต์เพลง" }, { status: 401 });

  try {
    const body = await req.json();
    const { url, title, artist, album, genre } = body;
    if (!url) return NextResponse.json({ error: "url จำเป็น" }, { status: 400 });

    const preview = await previewImport(String(url));
    if (preview.kind === "unknown") {
      return NextResponse.json({ error: "ลิงก์ไม่รองรับ" }, { status: 422 });
    }

    const finalTitle = String(title ?? preview.title ?? "Untitled").slice(0, 200);
    const finalArtist = String(artist ?? preview.artist ?? "Unknown artist").slice(0, 200);
    if (!finalTitle.trim() || !finalArtist.trim()) {
      return NextResponse.json({ error: "ใส่ชื่อเพลงและศิลปิน" }, { status: 400 });
    }

    const id = uid("trk");
    await db.insert(tracks).values({
      id,
      title: finalTitle,
      artist: finalArtist,
      album: album ? String(album).slice(0, 200) : null,
      genre: genre ? String(genre).slice(0, 50) : null,
      coverUrl: preview.coverUrl ?? null,
      // youtube/spotify เก็บลิงก์ต้นฉบับไว้, external เก็บลิงก์ mp3 ตรง
      audioUrl: String(url).slice(0, 500),
      source:
        preview.kind === "youtube"
          ? "youtube"
          : preview.kind === "spotify"
            ? "spotify"
            : "external",
      youtubeId: preview.youtubeId ?? null,
      spotifyId: preview.spotifyId ?? null,
      duration: 0,
      plays: 0,
      userId
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
