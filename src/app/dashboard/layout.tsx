// src/app/dashboard/layout.tsx
"use client";

import { Sidebar } from "@/components/Sidebar";
import { UserNav } from "@/components/UserNav";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Helper function to get page title from pathname
const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith("/dashboard/overview")) return "Dashboard Overview";
  if (pathname.startsWith("/dashboard/inbox")) return "Inbox";
  if (pathname.startsWith("/dashboard/knowledge-base")) return "Knowledge Base";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/dashboard")) return "Dashboard"; // Fallback for other /dashboard routes
  return "AI Responder"; // Default
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); // To control rendering of layout

  useEffect(() => {
    const checkAuthAndOrg = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Layout: Error fetching profile:", profileError.message);
          router.push("/login"); // Or an error page
          return;
        }
        
        if (profile && profile.organization_id) {
          setIsAuthorized(true); // User is logged in and has an org
        } else {
          // User is logged in but not onboarded (no organization_id)
          if (pathname !== "/onboarding/create-organization") {
             router.push("/onboarding/create-organization");
          } else {
            // If already on onboarding, allow it, but don't show dashboard layout
            // The create-organization page should have its own minimal layout
            setIsAuthorized(false); // Don't render dashboard layout for onboarding
          }
        }
      } catch (e: any) {
        console.error("Layout: Error in profile check:", e.message);
        router.push("/login"); // Fallback redirect
      } finally {
        setIsLoadingAuth(false);
      }
    };

    // Only run auth check if not on public-like pages (though middleware should handle most of this)
    // This layout is for authenticated, onboarded app sections.
    if (pathname !== "/login" && pathname !== "/onboarding/create-organization") {
        checkAuthAndOrg();
    } else {
        setIsLoadingAuth(false); 
        // If on login/onboarding, don't try to render this dashboard layout;
        // those pages will render their own full-page content.
        // This might mean this layout component shouldn't wrap those routes.
        // For now, this check prevents dashboard render on those pages.
    }

  }, [supabase, router, pathname]);

  const pageTitle = getPageTitle(pathname);

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not authorized for this layout (e.g., being redirected to onboarding, or on login page)
  // don't render the dashboard shell. The specific page component or redirect will handle it.
  // This is particularly important if this layout is applied too broadly.
  // For a route group like (app) or (dashboard), this check ensures it only renders for actual app pages.
  if (!isAuthorized && (pathname !== "/login" && pathname !== "/onboarding/create-organization")) {
      // This case means auth check finished, but user is not authorized for dashboard content
      // (e.g. no org_id and was meant to be redirected by useEffect but component is still trying to render)
      // This should ideally be a rare state if redirects work quickly.
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2">Loading session...</p>
        </div>
      );
  }
  
  // Only render the dashboard layout if authorized (i.e., logged in AND has an org)
  // AND not on login/onboarding pages (though route grouping should handle this better)
  if (!isAuthorized || pathname === "/login" || pathname === "/onboarding/create-organization") {
    // This layout is not for login or onboarding pages.
    // Return children directly if on such a page, assuming those pages handle their own full layout.
    // However, for a route group layout, this condition means the layout shouldn't apply.
    // A better approach is to ensure this layout ONLY applies to routes that *require* it.
    // For now, if we hit this, it means the page should be rendering its own thing.
    // This is a fallback; ideally, routing structure prevents this layout from wrapping non-dashboard pages.
    return <>{children}</>; // Or a loading state if children are not meant to be rendered yet
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background dark:bg-slate-800 dark:border-slate-700 px-6">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <UserNav />
        </header>
        {/* The main content area for the specific page */}
        <main className="flex-1 overflow-auto"> 
          {children}
        </main>
      </div>
    </div>
  );
}
