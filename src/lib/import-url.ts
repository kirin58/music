export type ImportKind = "youtube" | "spotify" | "external" | "unknown";

export type ImportPreview = {
  kind: ImportKind;
  youtubeId?: string;
  spotifyId?: string;
  audioUrl?: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
};

const YT_RE = /(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i;
const SPOTIFY_RE = /open\.spotify\.com\/(?:intl-[\w-]+\/)?track\/([A-Za-z0-9]{22})/i;
const AUDIO_EXT_RE = /\.(mp3|m4a|m4b|wav|ogg|oga|opus|webm|aac|flac|mp4|mov|m4v)(\?|#|$)/i;

/** แยกชนิดลิงก์ + ดึง metadata เบื้องต้น (oEmbed ไม่ต้องใช้ API key) */
export async function previewImport(rawUrl: string): Promise<ImportPreview> {
  const url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) return { kind: "unknown" };

  const yt = url.match(YT_RE);
  if (yt) {
    const youtubeId = yt[1];
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const meta = await res.json();
        return {
          kind: "youtube",
          youtubeId,
          title: meta.title,
          artist: meta.author_name,
          coverUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
        };
      }
    } catch {}
    return { kind: "youtube", youtubeId, coverUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };
  }

  const sp = url.match(SPOTIFY_RE);
  if (sp) {
    const spotifyId = sp[1];
    try {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const meta = await res.json();
        // oEmbed Spotify ให้ title เป็น "เพลง — ศิลปิน"
        const [title, ...rest] = String(meta.title ?? "").split(" - ");
        return {
          kind: "spotify",
          spotifyId,
          title: title || undefined,
          artist: rest.join(" - ") || undefined,
          coverUrl: meta.thumbnail_url
        };
      }
    } catch {}
    return { kind: "spotify", spotifyId };
  }

  if (AUDIO_EXT_RE.test(url)) {
    // ตรวจว่า URL ตอบเป็นไฟล์เสียงจริง (best-effort)
    try {
      const head = await fetch(url, { method: "HEAD" });
      const ct = head.headers.get("content-type") ?? "";
      if (head.ok && (ct.startsWith("audio/") || ct.startsWith("video/") || ct === "application/octet-stream")) {
        return { kind: "external", audioUrl: url };
      }
    } catch {}
    // HEAD โดนบล็อกบางโฮสต์ก็ยอมให้ผ่าน (ไปวัดตอนเล่นจริง)
    return { kind: "external", audioUrl: url };
  }

  return { kind: "unknown" };
}
