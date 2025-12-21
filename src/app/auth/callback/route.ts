import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
        );
      }

      // If user exists and session is valid, redirect to home
      if (data.session) {
        // Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.session.user.id)
          .single();

        if (!existingProfile) {
          const user = data.session.user;
          const username = 
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";

          await supabase.from("profiles").upsert({
            id: user.id,
            username: username.replace(/\s+/g, "_").toLowerCase(),
            full_name: user.user_metadata?.full_name || username,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          });
        }

        return NextResponse.redirect(`${requestUrl.origin}/`);
      }
    } catch (err) {
      console.error("Auth callback exception:", err);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Authentication%20failed`
      );
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
