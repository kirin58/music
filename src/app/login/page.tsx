"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2, Chrome } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const googleOn = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });
    setBusy(false);
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <h1 className="text-center text-2xl font-extrabold">เข้าสู่ระบบ</h1>
      <p className="mt-1 text-center text-sm text-zinc-400">ล็อกอินก่อนโพสต์เพลง สร้างเพลย์ลิสต์ และกดไลก์</p>

      {googleOn && (
        <>
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-surface-border bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <Chrome size={17} /> เข้าด้วย Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-surface-border" /> หรือด้วยอีเมล{" "}
            <span className="h-px flex-1 bg-surface-border" />
          </div>
        </>
      )}
      {!googleOn && <div className="mt-6" />}

      <form onSubmit={onSubmit} className="card space-y-3 p-5">
        <div>
          <label className="label">อีเมล</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.com"
          />
        </div>
        <div>
          <label className="label">รหัสผ่าน</label>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button className="btn-brand w-full py-2.5" disabled={busy}>
          {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-400">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-semibold text-white underline">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
