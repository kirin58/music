import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";

export const metadata: Metadata = {
  title: "waveform — ฟังเพลง อัปโหลด แชร์",
  description: "Web app ฟังเพลงแบบ Spotify: อัปโหลด mp3, สร้างเพลย์ลิสต์, สตรีมจริงด้วย Next.js + Turso + R2"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="flex h-screen overflow-hidden bg-black">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-40 md:px-6 md:pb-32">
            <div className="mx-auto max-w-[1200px]">
              <Topbar />
              {children}
              <footer className="mt-14 border-t border-surface-border pt-6 pb-4 text-xs text-zinc-600">
                waveform demo • metadata อยู่บน Turso • ไฟล์เสียงอยู่บน Cloudflare R2 • ฟังได้จริงผ่าน
                HTML5 audio
              </footer>
            </div>
          </main>
        </div>
        <MobileNav />
        <PlayerBar />
      </body>
    </html>
  );
}
