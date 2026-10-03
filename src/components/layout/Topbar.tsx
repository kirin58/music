"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Topbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-black/80 py-3 backdrop-blur">
      <div className="hidden items-center gap-2 md:flex">
        <button
          onClick={() => router.back()}
          className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised text-zinc-400 hover:text-white"
          aria-label="back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised text-zinc-400 hover:text-white"
          aria-label="forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        }}
        className="relative w-full max-w-md"
      >
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาเพลง ศิลปิน อัลบั้ม..."
          className="w-full rounded-full border border-transparent bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/upload" className="btn-ghost hidden sm:inline-block">
          โพสต์เพลง
        </Link>
        {status === "loading" ? (
          <span className="h-9 w-9 animate-pulse rounded-full bg-surface-hover" />
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-black"
              title={session.user.email ?? ""}
            >
              {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="grid h-9 w-9 place-items-center rounded-full bg-surface-raised text-zinc-400 hover:text-white"
              title="ออกจากระบบ"
              aria-label="sign-out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-brand">
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </header>
  );
}
