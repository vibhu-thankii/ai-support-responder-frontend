// src/app/dashboard/inbox/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { QueryList, type CustomerQuery } from "@/components/QueryList";
import { QueryDetailView } from "@/components/QueryDetailView";
import { Loader2 } from "lucide-react";

export default function InboxPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<CustomerQuery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // State for the active filter

  useEffect(() => {
    const checkUserAndOrg = async () => {
      setIsLoadingAuth(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        if (pathname !== "/login") {
            router.push("/login");
        } else {
            setIsLoadingAuth(false);
        }
        return; // Exit the function if there's no session
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError.message);
            if (pathname !== "/login") {
                router.push("/login");
            }
            return;
        }

        if (profile && profile.organization_id) {
          setUserOrgId(profile.organization_id);
        } else {
          if (pathname !== "/onboarding/create-organization") {
            router.push("/onboarding/create-organization");
          }
        }
      } catch (e: any) {
        console.error("Error in profile check:", e.message);
        if (pathname !== "/login") {
            router.push("/login");
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkUserAndOrg();
  }, [supabase, router, pathname]);

  const handleSelectQuery = (query: CustomerQuery) => {
    setSelectedQuery(query);
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-full w-full items-center justify-center"> {/* Changed h-screen to h-full */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading Inbox...</p>
      </div>
    );
  }

  // This page should only render if userOrgId is present
  if (!userOrgId) {
      // This case should ideally be handled by redirects, but as a fallback:
      return (
          <div className="flex h-full w-full items-center justify-center">
              <p className="ml-3 text-lg">Organization not found. Please complete onboarding.</p>
          </div>
      );
  }

  return (
    // This div will be the main content area for the inbox page, fitting into the overall layout
    <div className="flex-1 overflow-hidden min-h-0 h-full"> {/* Ensure it takes full height of its container */}
      <ResizablePanelGroup direction="horizontal" className="h-full max-w-full">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <QueryList
            selectedQueryId={selectedQuery?.id}
            onSelectQuery={handleSelectQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter} // Pass the setter function
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={60}>
            <QueryDetailView query={selectedQuery} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
