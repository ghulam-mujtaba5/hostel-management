import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export async function GET() {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch profiles and vote counts for all feedback items
    const withVotesAndProfiles = await Promise.all(
      (data || []).map(async (item: any) => {
        // Get vote count
        const { count } = await supabase
          .from("feedback_votes")
          .select("id", { count: "exact", head: true })
          .eq("feedback_id", item.id);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, full_name")
          .eq("id", item.user_id)
          .single();

        return {
          ...item,
          vote_count: count || 0,
          profile: profile || { username: "Unknown", avatar_url: null, full_name: null }
        };
      })
    );

    return NextResponse.json({ data: withVotesAndProfiles });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
