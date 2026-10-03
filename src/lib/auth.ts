import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";
import { uid } from "./utils";

const hasGoogle = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    ...(hasGoogle
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!
          })
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = rows[0];
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image ?? undefined };
      }
    })
  ],
  callbacks: {
    // สร้าง user ใน Turso อัตโนมัติเมื่อล็อกอินด้วย Google ครั้งแรก
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!rows[0]) {
          await db.insert(users).values({
            id: uid("usr"),
            name: user.name ?? email.split("@")[0],
            email,
            image: user.image ?? null,
            provider: "google"
          });
        }
        // ผูก id จาก DB เข้า user object เพื่อให้ jwt callback ใช้ต่อ
        const fresh = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (fresh[0]) {
          user.id = fresh[0].id;
          user.name = fresh[0].name;
          user.image = fresh[0].image ?? undefined;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      // เติมชื่อ/รูปจาก DB (เผื่อ login ด้วย credentials)
      if (token.email && !token.name) {
        try {
          const rows = await db
            .select()
            .from(users)
            .where(eq(users.email, String(token.email).toLowerCase()))
            .limit(1);
          if (rows[0]) {
            token.uid = rows[0].id;
            token.name = rows[0].name;
            token.picture = rows[0].image ?? undefined;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as unknown as { id: string }).id = String(token.uid);
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});
