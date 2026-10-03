# waveform — web app ฟังเพลงแบบ Spotify (Next.js + Tailwind + Turso + R2)

อัปโหลด .mp3 ของตัวเอง -> เก็บไฟล์จริงบน Cloudflare R2 -> เก็บ metadata จริงบน Turso (libSQL)
-> สตรีมผ่าน `HTML5 <audio>` + bottom player (play/pause/seek/volume/shuffle/repeat/queue)

## 1. ติดตั้ง

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
```

## 2. สร้าง Database ฟรี (เลือก 1 — แนะนำ Turso)

ดูตารางเปรียบเทียบในคำตอบแชท โปรเจกต์นี้เขียนมารองรับ **Turso** โดยตรง

```bash
# 1) สมัคร https://turso.tech + ติดตั้ง CLI
turso db create music-app
turso db show music-app --url        # -> TURSO_DATABASE_URL
turso db tokens create music-app     # -> TURSO_AUTH_TOKEN

# 2) ใส่ใน .env แล้วดัน schema
npm run db:push
```

schema อยู่ที่ `src/lib/schema.ts`:
`users / tracks / playlists / playlist_tracks / likes`

## 3. สร้างที่เก็บไฟล์เพลง (Cloudflare R2 — ฟรี 10GB)

1. Cloudflare Dashboard -> R2 -> Create bucket `music-app`
2. R2 -> Manage R2 API Tokens -> สร้าง token (Object Read & Write)
3. Settings -> Public access -> เปิด `r2.dev` subdomain -> ได้ `R2_PUBLIC_URL`
4. ใส่ `R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL` ใน `.env`

> ทำไมไม่เก็บ mp3 ใน DB? DB เก็บ binary ใหญ่ไม่ได้ + แพง + ช้า
> pattern ที่ถูก: **DB เก็บแค่ URL + metadata / ไฟล์จริงอยู่ object storage**

โฟลว์อัปโหลด (`src/app/api/upload/route.ts`):
`client -> POST /api/upload -> server ออก presigned PUT URL -> client PUT ตรงไป R2 -> POST /api/tracks บันทึก URL`

## 4. รัน

```bash
npm run dev   # http://localhost:3000
```

ยังไม่ตั้ง env ก็เปิดดู UI ได้ (หน้าแรกจะขึ้น empty state ชวนอัปโหลด)

## 5. Deploy (Vercel — ฟรี)

1. push ขึ้น GitHub
2. Vercel -> New Project -> import repo
3. Environment Variables: copy ทุกตัวจาก `.env.example` ไปวาง
4. Deploy -> ใช้งานได้จริงทันที (ไม่ต้องมี server แยก เพราะ API อยู่ใน `src/app/api/*`)

## โครงไฟล์

```
src/
  app/
    layout.tsx                # shell: Sidebar + Topbar + PlayerBar
    page.tsx + HomeClient.tsx # หน้าแรก (SSR ดึง Turso + client filter/play)
    search/page.tsx           # ค้นหา (เรียก /api/tracks?q=)
    library/page.tsx          # เพลย์ลิสต์ + เพลงที่ถูกใจ
    upload/page.tsx           # ฟอร์มโพสต์เพลง (presigned upload)
    playlist/[id]/            # หน้าเพลย์ลิสต์เดี่ยว
    api/
      tracks/                 # GET list/search, POST create, [id]/play นับยอด
      tracks/import/          # GET preview ลิงก์, POST บันทึกเพลงจากลิงก์ (ต้องล็อกอิน)
      upload/                 # ออก presigned URL ขึ้น R2 (ต้องล็อกอิน)
      playlists/              # CRUD เพลย์ลิสต์ + เติมเพลง (ต้องล็อกอิน)
      likes/                  # ไลก์ / อันไลก์ (ต้องล็อกอิน)
      auth/[...nextauth]/     # Auth.js: login/logout/session
      auth/register/          # สมัครสมาชิกด้วยอีเมล
    login/ + register/        # หน้าล็อกอิน / สมัคร (Google + อีเมล)
  components/
    layout/ Sidebar, Topbar, MobileNav
    player/ PlayerBar         # <audio> + YouTube API + Spotify embed + seek/volume/shuffle/repeat
    track/  TrackCard, TrackRow
  store/player-store.ts       # zustand: current/queue/isPlaying (+ source/youtubeId/spotifyId)
  lib/db.ts                   # drizzle + @libsql/client (Turso / file:local.db)
  lib/schema.ts               # schema ฐานข้อมูล
  lib/r2.ts                   # S3 client + presigned URL
  lib/auth.ts                 # Auth.js v5 (Google + Credentials, JWT)
  lib/current-user.ts         # getUserId() จาก session
  lib/import-url.ts           # แยกชนิดลิงก์ YouTube/Spotify/mp3 + oEmbed
  lib/utils.ts                # formatTime/formatPlays/uid
```

## ล็อกอิน + นำเข้าลิงก์

- สมัคร/ล็อกอินด้วยอีเมลได้เลย (`AUTH_SECRET` มีแล้ว) โพสต์เพลง/เพลย์ลิสต์/ไลก์ต้องล็อกอินก่อน
- เปิดปุ่ม Google: สร้าง OAuth client ที่ Google Cloud Console (redirect:
  `http://localhost:3000/api/auth/callback/google`) ใส่ `AUTH_GOOGLE_ID/SECRET`
  แล้วตั้ง `NEXT_PUBLIC_GOOGLE_ENABLED="1"` (ดู `.env.example`)
- แท็บ "วางลิงก์" ในหน้า upload รับ YouTube / Spotify track / ลิงก์ .mp3 ตรง
  กดตรวจสอบเพื่อดึงชื่อ-ศิลปิน-ปกอัตโนมัติ แล้วบันทึกเป็นเพลงของตัวเอง
  (YouTube เล่นผ่าน YouTube player, Spotify ผ่าน Spotify embed)

## ต่อยอด (ยังไม่ทำใน MVP)

- Auth จริง: Auth.js v5 / Clerk / Lucia + `DEMO_USER_ID` -> session.user.id
- Pro: waveform/seek preview, HLS, adaptive bitrate
- Admin: ลบเพลง, report, ตรวจลิขสิทธิ์ (สำคัญถ้าเปิด public — รับเฉพาะเพลงที่ผู้ใช้มีสิทธิ์)
- Search เต็มรูปแบบ: Meilisearch/Typesense, full-text
- Realtime: Pusher/Ably สำหรับ collaborative playlist
```

## กฎหมายสั้นๆ

อย่าอัปโหลดเพลงมีลิขสิทธิ์ที่ไม่ใช่ของตัวเองขึ้น public hosting
MVP นี้เหมาะกับเพลงตัวเอง / เพลง demo / ไฟล์ที่ได้รับอนุญาต
