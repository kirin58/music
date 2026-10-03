"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สมัครไม่สำเร็จ");
      // สมัครเสร็จล็อกอินให้เลย
      const login = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: "/"
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <h1 className="text-center text-2xl font-extrabold">สมัครสมาชิก</h1>
      <p className="mt-1 text-center text-sm text-zinc-400">สร้างบัญชีเพื่อโพสต์เพลงของตัวเอง</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-3 p-5">
        <div>
          <label className="label">ชื่อที่แสดง</label>
          <input required className="input" value={form.name} onChange={set("name")} placeholder="ชื่อของคุณ" />
        </div>
        <div>
          <label className="label">อีเมล</label>
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={set("email")}
            placeholder="you@mail.com"
          />
        </div>
        <div>
          <label className="label">รหัสผ่าน (≥ 6 ตัวอักษร)</label>
          <input
            required
            type="password"
            minLength={6}
            className="input"
            value={form.password}
            onChange={set("password")}
            placeholder="••••••"
          />
        </div>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button className="btn-brand w-full py-2.5" disabled={busy}>
          {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-semibold text-white underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
