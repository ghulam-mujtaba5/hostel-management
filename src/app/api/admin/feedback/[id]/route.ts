import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const allowedKeys = new Set(["status", "priority"]);
    const updates: Record<string, any> = {};
    for (const [k, v] of Object.entries(body || {})) {
      if (allowedKeys.has(k)) updates[k] = v;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("feedback").update(updates).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("feedback").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
