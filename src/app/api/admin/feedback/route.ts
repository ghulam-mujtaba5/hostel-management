import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("feedback")
      .select(
        `
        *,
        profile:user_id(username, avatar_url, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Vote counts (kept simple; can be optimized later with a view/RPC)
    const withVotes = await Promise.all(
      (data || []).map(async (item: any) => {
        const { count } = await supabase
          .from("feedback_votes")
          .select("id", { count: "exact", head: true })
          .eq("feedback_id", item.id);

        return { ...item, vote_count: count || 0 };
      })
    );

    return NextResponse.json({ data: withVotes });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
