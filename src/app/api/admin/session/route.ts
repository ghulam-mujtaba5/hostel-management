import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, isAdminSession, setAdminSessionCookie } from "@/lib/adminSession";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSession() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  const expected = process.env.ADMIN_PORTAL_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server missing ADMIN_PORTAL_PASSWORD" },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return NextResponse.json({ authenticated: false });
}
