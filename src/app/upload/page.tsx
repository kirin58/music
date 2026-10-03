"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, Loader2, CheckCircle2 } from "lucide-react";

const GENRES = ["Pop", "Rock", "Hip-Hop", "R&B", "Indie", "Electronic", "ลูกทุ่ง", "เพื่อชีวิต", "อื่นๆ"];

export default function UploadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", artist: "", album: "", genre: "Pop" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function uploadViaPresigned(file: File, kind: "audio" | "cover"): Promise<string> {
    // 1) ขอ presigned URL จาก server
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type, filename: file.name })
    });
    if (!res.ok) throw new Error("ขอ upload URL ไม่สำเร็จ (เช็ค env R2_*)");
    const { uploadUrl, fileUrl } = await res.json();
    // 2) PUT ไฟล์ตรงไป R2
    const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!put.ok) throw new Error("อัปโหลดไฟล์ไป R2 ไม่สำเร็จ");
    return fileUrl as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) {
      setStatus("เลือกไฟล์เสียง .mp3 ก่อน");
      return;
    }
    if (!form.title.trim() || !form.artist.trim()) {
      setStatus("กรอกชื่อเพลงและศิลปินก่อน");
      return;
    }
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
      // อ่าน duration จากไฟล์
      const duration = await new Promise<number>((resolve) => {
        const url = URL.createObjectURL(audioFile);
        const el = document.createElement("audio");
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
        body: JSON.stringify({ ...form, audioUrl, coverUrl: coverUrl || undefined, duration })
      });
      if (!res.ok) throw new Error("บันทึก metadata ไม่สำเร็จ (เช็ค TURSO_*)");
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
    <div className="mx-auto mt-2 max-w-2xl">
      <h1 className="text-2xl font-bold">โพสต์เพลงของคุณ</h1>
      <p className="mt-1 text-sm text-zinc-400">
        ไฟล์เสียงจะถูกอัปโหลดตรงไป Cloudflare R2 ผ่าน presigned URL ส่วนชื่อเพลง/ศิลปินจะเก็บใน Turso
      </p>

      <form onSubmit={onSubmit} className="card mt-5 space-y-4 p-5 md:p-6">
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

        <div>
          <label className="label">ไฟล์เสียง (.mp3 / .m4a / .wav) *</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-surface-hover p-4 transition hover:border-zinc-500">
            <UploadIcon size={20} className="shrink-0 text-zinc-400" />
            <span className="truncate text-sm text-zinc-300">
              {audioFile ? `${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(1)} MB)` : "คลิกเพื่อเลือกไฟล์เสียง"}
            </span>
            <input
              type="file"
              accept="audio/*"
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
    </div>
  );
}
