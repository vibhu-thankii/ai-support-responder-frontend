// src/app/page.tsx (New Root Page - Redirector)
"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError.message);
        if (pathname !== "/login") router.push("/login");
        return;
      }

      if (!session) {
        if (pathname !== "/login") router.push("/login");
        return;
      }

      // User is logged in, check if they have an organization
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
          console.error("Error fetching profile for root redirect:", profileError.message);
          // Potentially redirect to an error page or login
          if (pathname !== "/login") router.push("/login"); 
          return;
        }

        if (profile && profile.organization_id) {
          // User is onboarded, redirect to the main dashboard overview
          if (pathname !== "/dashboard/overview") { // Check to prevent redirect loop if already there
            router.push("/dashboard/overview");
          }
        } else {
          // User is logged in but not onboarded (no organization_id)
          if (pathname !== "/onboarding/create-organization") { // Check to prevent redirect loop
             router.push("/onboarding/create-organization");
          }
        }
      } catch (e: any) {
        console.error("Error in root page auth check:", e.message);
        if (pathname !== "/login") router.push("/login"); // Fallback
      }
    };

    // Only run redirect logic if we are on the root path itself
    // to avoid interfering with other pages' auth checks.
    // Or, this logic could be entirely in middleware.ts for cleaner separation.
    // For now, let's assume this page.tsx is specifically for the "/" route.
    if (pathname === "/") {
        checkAuthAndRedirect();
    } else {
        // If this component somehow renders for other paths, do nothing here,
        // let those pages handle their own auth/redirects or rely on middleware.
        // However, with Next.js App Router, this page.tsx should only render for "/".
    }

  }, [supabase, router, pathname]);

  // Show a generic loading indicator while checks are in progress,
  // especially if this component is rendered for the root path.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-3 text-lg">Loading...</p>
    </div>
  );
}
