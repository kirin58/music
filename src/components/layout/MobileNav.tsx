"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Upload } from "lucide-react";

const items = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/search", label: "ค้นหา", icon: Search },
  { href: "/library", label: "คลัง", icon: Library },
  { href: "/upload", label: "อัปโหลด", icon: Upload }
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-[76px] z-20 mx-3 flex rounded-2xl border border-surface-border bg-surface-raised/95 p-1 backdrop-blur md:hidden">
      {items.map((it) => {
        const active = pathname === it.href;
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium ${
              active ? "text-white" : "text-zinc-500"
            }`}
          >
            <Icon size={20} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
