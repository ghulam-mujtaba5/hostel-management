import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error_description = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Handle OAuth errors
  if (error_description) {
    console.error("OAuth error:", error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description)}`
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
        );
      }

      // If user exists and session is valid, create profile and redirect
      if (data.session && data.user) {
        const user = data.user;
        
        // Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        let isFirstUser = false;
        
        if (!existingProfile) {
          const username = 
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";

          const { error: profileError } = await supabase.from("profiles").upsert({
            id: user.id,
            username: username.replace(/\s+/g, "_").toLowerCase(),
            full_name: user.user_metadata?.full_name || username,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            email: user.email,
          });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Continue anyway - user can update profile later
          }
          
          isFirstUser = true;
        }

        // Check if user has any spaces, if not redirect to onboarding
        const { data: userSpaces } = await supabase
          .from("space_members")
          .select("space_id")
          .eq("user_id", user.id)
          .limit(1);

        // Redirect to onboarding if no spaces, otherwise to dashboard
        const redirectPath = (!userSpaces || userSpaces.length === 0) 
          ? "/spaces/create?welcome=true" 
          : next;

        // Successful auth - redirect with clean URL
        const redirectUrl = new URL(redirectPath, requestUrl.origin);
        return NextResponse.redirect(redirectUrl.toString());
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
