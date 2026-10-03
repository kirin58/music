import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload, publicFileUrl } from "@/lib/r2";
import { getUserId } from "@/lib/current-user";

const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"];
// mp4 ทั่วไป (music video / เสียงใน container วิดีโอ) อัปโหลดเป็น kind เดียวกับ audio ได้เลย
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST { kind: 'audio'|'cover', contentType, filename }
 * -> { uploadUrl, fileUrl, key }
 * client เอา uploadUrl ไป PUT ไฟล์ตรงขึ้น R2
 */
export async function POST(req: NextRequest) {
  if (!(await getUserId())) {
    return NextResponse.json({ error: "ล็อกอินก่อนอัปโหลด" }, { status: 401 });
  }
  try {
    const { kind, contentType, filename } = await req.json();
    if (kind !== "audio" && kind !== "cover") {
      return NextResponse.json({ error: "kind ต้องเป็น audio หรือ cover" }, { status: 400 });
    }
    if (kind === "audio" && !AUDIO_TYPES.includes(contentType) && !VIDEO_TYPES.includes(contentType)) {
      // ปล่อยผ่านแบบเตือน (บาง browser ส่ง audio/x-m4a ฯลฯ)
      if (!String(contentType).startsWith("audio/") && !String(contentType).startsWith("video/")) {
        return NextResponse.json({ error: `ชนิดไฟล์ไม่รองรับ: ${contentType} (รับ audio/*, mp4, webm)` }, { status: 400 });
      }
    }
    if (kind === "cover" && !COVER_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "ปกต้องเป็น jpg/png/webp" }, { status: 400 });
    }

    const safe = String(filename ?? "file").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
    const ext = safe.includes(".") ? safe.split(".").pop() : kind === "audio" ? "mp3" : "jpg";
    const key = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadUrl = await createPresignedUpload({ key, contentType });
    return NextResponse.json({ uploadUrl, fileUrl: publicFileUrl(key), key });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "ออก upload URL ไม่สำเร็จ — ตั้งค่า R2_ACCOUNT_ID / R2_* ใน .env หรือยัง?" },
      { status: 500 }
    );
  }
}
