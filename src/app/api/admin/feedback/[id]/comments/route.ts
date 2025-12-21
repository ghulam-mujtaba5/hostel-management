import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("feedback_comments")
      .select(
        `
        *,
        profile:user_id(username, avatar_url, full_name)
      `
      )
      .eq("feedback_id", id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);

    const comment = body?.comment;
    const user_id = body?.user_id;

    if (typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }
    if (typeof user_id !== "string" || !user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("feedback_comments").insert({
      feedback_id: id,
      user_id,
      comment,
      is_admin_response: true,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
