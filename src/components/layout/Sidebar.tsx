"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Upload, Disc3 } from "lucide-react";

const items = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/search", label: "ค้นหา", icon: Search },
  { href: "/library", label: "คลังของฉัน", icon: Library },
  { href: "/upload", label: "อัปโหลดเพลง", icon: Upload }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-4 p-3">
      <Link href="/" className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-black">
          <Disc3 size={22} />
        </span>
        <span className="text-[17px] font-bold tracking-tight">
          wave<span className="text-brand">form</span>
        </span>
      </Link>

      <nav className="card p-2">
        {items.slice(0, 2).map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={22} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="card flex min-h-0 flex-1 flex-col p-2">
        {items.slice(2).map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={22} />
              {it.label}
            </Link>
          );
        })}
        <div className="mt-3 border-t border-surface-border px-3 py-3 text-xs leading-relaxed text-zinc-500">
          อัปโหลดไฟล์ .mp3 ของคุณเอง
          <br />
          ระบบจะเก็บไฟล์บน R2
          <br />
          และ metadata บน Turso
        </div>
      </div>
    </aside>
  );
}
