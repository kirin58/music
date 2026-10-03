"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Upload as UploadIcon, Loader2, CheckCircle2, Link2, FileAudio } from "lucide-react";
import type { ImportPreview } from "@/lib/import-url";

const GENRES = ["Pop", "Rock", "Hip-Hop", "R&B", "Indie", "Electronic", "ลูกทุ่ง", "เพื่อชีวิต", "อื่นๆ"];

function MetaFields({
  form,
  set
}: {
  form: { title: string; artist: string; album: string; genre: string };
  set: (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label">ชื่อเพลง *</label>
        <input className="input" value={form.title} onChange={set("title")} placeholder="เช่น ดาวหาง" />
      </div>
      <div>
        <label className="label">ศิลปิน *</label>
        <input className="input" value={form.artist} onChange={set("artist")} placeholder="เช่น Bedroom Audio" />
      </div>
      <div>
        <label className="label">อัลบั้ม</label>
        <input className="input" value={form.album} onChange={set("album")} placeholder="(ไม่บังคับ)" />
      </div>
      <div>
        <label className="label">แนวเพลง</label>
        <select className="input" value={form.genre} onChange={set("genre")}>
          {GENRES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FileTab() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", artist: "", album: "", genre: "Pop" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function uploadViaPresigned(file: File, kind: "audio" | "cover"): Promise<string> {
    let res: Response;
    try {
      res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, contentType: file.type, filename: file.name })
      });
    } catch {
      throw new Error("ต่อเซิร์ฟเวอร์ไม่ติด (ขั้นขอ upload URL) — เปิดผิด port หรือ dev server ดับ?");
    }
    if (res.status === 401) throw new Error("ล็อกอินก่อนอัปโหลด");
    if (!res.ok) throw new Error("ขอ upload URL ไม่สำเร็จ (เช็ค env R2_*)");
    const { uploadUrl, fileUrl } = await res.json();
    let put: Response;
    try {
      put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    } catch {
      throw new Error("ยิงไฟล์ไป R2 ไม่ถึง (ขั้น PUT) — ไปเพิ่ม CORS Policy ใน bucket Settings ให้อนุญาต PUT จาก localhost");
    }
    if (!put.ok) throw new Error("อัปโหลดไฟล์ไป R2 ไม่สำเร็จ");
    return fileUrl as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) return setStatus("เลือกไฟล์เสียง (.mp3 / .mp4 / .m4a / .wav) ก่อน");
    if (!form.title.trim() || !form.artist.trim()) return setStatus("กรอกชื่อเพลงและศิลปินก่อน");
    setBusy(true);
    setStatus("กำลังอัปโหลดไฟล์เสียง...");
    try {
      const audioUrl = await uploadViaPresigned(audioFile, "audio");
      let coverUrl = "";
      if (coverFile) {
        setStatus("กำลังอัปโหลดปก...");
        coverUrl = await uploadViaPresigned(coverFile, "cover");
      }
      setStatus("กำลังบันทึกข้อมูลเพลง...");
      // อ่าน duration จากไฟล์ (mp4 ใช้ <video>, ที่เหลือใช้ <audio>)
      const duration = await new Promise<number>((resolve) => {
        const url = URL.createObjectURL(audioFile);
        const el = document.createElement(audioFile.type.startsWith("video/") ? "video" : "audio");
        el.preload = "metadata";
        el.onloadedmetadata = () => {
          resolve(Math.round(el.duration || 0));
          URL.revokeObjectURL(url);
        };
        el.onerror = () => resolve(0);
        el.src = url;
      });

      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, audioUrl, coverUrl: coverUrl || undefined, duration, source: "upload" })
      });
      if (!res.ok) throw new Error("บันทึก metadata ไม่สำเร็จ");
      setDone(true);
      setStatus("เผยแพร่สำเร็จ!");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="card mt-5 space-y-4 p-5 md:p-6">
      <MetaFields form={form} set={set} />
      <div>
        <label className="label">ไฟล์เสียง (.mp3 / .mp4 / .m4a / .wav) *</label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-surface-hover p-4 transition hover:border-zinc-500">
          <UploadIcon size={20} className="shrink-0 text-zinc-400" />
          <span className="truncate text-sm text-zinc-300">
            {audioFile ? `${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(1)} MB)` : "คลิกเพื่อเลือกไฟล์เสียงหรือวิดีโอ mp4"}
          </span>
          <input
            type="file"
            accept="audio/*,video/mp4,video/webm,.mp4,.m4a"
            className="hidden"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div>
        <label className="label">ภาพปก (jpg/png, ไม่บังคับ)</label>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-surface-hover file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-[#333]"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {status && (
        <p className={`flex items-center gap-2 text-sm ${done ? "text-brand" : "text-zinc-300"}`}>
          {busy && <Loader2 size={15} className="animate-spin" />}
          {done && <CheckCircle2 size={15} />}
          {status}
        </p>
      )}
      <button className="btn-brand w-full py-3" disabled={busy}>
        {busy ? "กำลังเผยแพร่..." : "เผยแพร่เพลง"}
      </button>
    </form>
  );
}

const KIND_LABEL: Record<string, string> = {
  youtube: "YouTube",
  spotify: "Spotify",
  external: "ไฟล์เสียงตรง"
};

function LinkTab() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [form, setForm] = useState({ title: "", artist: "", album: "", genre: "Pop" });
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function check() {
    if (!url.trim()) return setStatus("วางลิงก์ก่อน");
    setChecking(true);
    setStatus("กำลังอ่านลิงก์...");
    setPreview(null);
    try {
      const res = await fetch(`/api/tracks/import?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อ่านลิงก์ไม่สำเร็จ");
      setPreview(data.preview as ImportPreview);
      setForm((f) => ({
        ...f,
        title: data.preview.title ?? "",
        artist: data.preview.artist ?? ""
      }));
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "อ่านลิงก์ไม่สำเร็จ");
    } finally {
      setChecking(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) return;
    if (!form.title.trim() || !form.artist.trim()) return setStatus("กรอกชื่อเพลงและศิลปินก่อน");
    setBusy(true);
    setStatus("กำลังบันทึก...");
    try {
      const res = await fetch("/api/tracks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), ...form })
      });
      const data = await res.json();
      if (res.status === 401) throw new Error("ล็อกอินก่อนโพสต์เพลง");
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setDone(true);
      setStatus("นำเข้าเพลงสำเร็จ!");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="card mt-5 space-y-4 p-5 md:p-6">
      <div>
        <label className="label">ลิงก์เพลง (YouTube / Spotify track / ไฟล์ .mp3 ตรง)</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="เช่น https://www.youtube.com/watch?v=..."
          />
          <button onClick={check} disabled={checking} className="btn-ghost shrink-0">
            {checking ? <Loader2 size={16} className="animate-spin" /> : "ตรวจสอบ"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          YouTube เล่นผ่านตัวเล่น YouTube ในแอป • Spotify เล่นผ่านตัวเล่น Spotify • ไฟล์ mp3 ตรงเล่นได้เลยไม่เปลืองพื้นที่ R2
        </p>
      </div>

      {preview && (
        <form onSubmit={save} className="space-y-4 border-t border-surface-border pt-4">
          <div className="flex items-center gap-3">
            {preview.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.coverUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-surface-hover text-xl">🎵</div>
            )}
            <div>
              <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
                {KIND_LABEL[preview.kind] ?? preview.kind}
              </span>
              <p className="mt-1 truncate text-sm text-zinc-400">{preview.title ?? "—"}</p>
            </div>
          </div>
          <MetaFields form={form} set={set} />
          {status && (
            <p className={`flex items-center gap-2 text-sm ${done ? "text-brand" : "text-zinc-300"}`}>
              {busy && <Loader2 size={15} className="animate-spin" />}
              {done && <CheckCircle2 size={15} />}
              {status}
            </p>
          )}
          <button className="btn-brand w-full py-3" disabled={busy}>
            {busy ? "กำลังนำเข้า..." : "นำเข้าเป็นเพลงของฉัน"}
          </button>
        </form>
      )}

      {!preview && status && <p className="text-sm text-zinc-300">{status}</p>}
    </div>
  );
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"file" | "link">("file");

  if (status === "loading") {
    return <p className="mt-10 text-center text-sm text-zinc-500">กำลังโหลด...</p>;
  }

  if (!session?.user) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-xl font-bold">ต้องล็อกอินก่อนโพสต์เพลง</h1>
        <p className="mt-1 text-sm text-zinc-400">สมัครฟรีด้วยอีเมล หรือเข้าด้วย Google</p>
        <Link href="/login?callbackUrl=/upload" className="btn-brand mt-5 inline-block">
          ไปหน้าล็อกอิน
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-2 max-w-2xl">
      <h1 className="text-2xl font-bold">โพสต์เพลงของคุณ</h1>
      <p className="mt-1 text-sm text-zinc-400">
        อัปโหลดไฟล์ของตัวเอง หรือวางลิงก์ YouTube/Spotify/ไฟล์ mp3 แล้วบันทึกเป็นเพลงในคลัง
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTab("file")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "file" ? "bg-white text-black" : "bg-surface-raised text-zinc-300 hover:bg-surface-hover"
          }`}
        >
          <FileAudio size={15} /> อัปโหลดไฟล์
        </button>
        <button
          onClick={() => setTab("link")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "link" ? "bg-white text-black" : "bg-surface-raised text-zinc-300 hover:bg-surface-hover"
          }`}
        >
          <Link2 size={15} /> วางลิงก์
        </button>
      </div>

      {tab === "file" ? <FileTab /> : <LinkTab />}
    </div>
  );
}
