// src/components/QueryList.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client"; // Supabase client
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Define the shape of a single query object from the backend
export interface CustomerQuery {
  id: string;
  organization_id: string;
  channel: string;
  sender_identifier: string;
  sender_name?: string | null;
  subject?: string | null;
  body_text: string;
  status: string;
  received_at: string;
  original_created_at?: string | null;
  ai_draft_response?: string | null;
  ai_response_source?: string | null;
  ai_retrieved_context_count?: number | null;
}

interface QueryListProps {
  selectedQueryId?: string | null;
  onSelectQuery: (query: CustomerQuery) => void;
}

export function QueryList({ selectedQueryId, onSelectQuery }: QueryListProps) {
  const supabase = createClient();
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define header height as a constant for calc()
  const HEADER_HEIGHT = '60px'; // Adjust as needed, e.g., based on py-3 (24px) + text height

  useEffect(() => {
    const fetchCustomerQueries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }
        if (!session) {
          toast.error("Not authenticated. Please log in to view queries.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/customer-queries`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Failed to fetch customer queries"
          );
        }
        const data: CustomerQuery[] = await response.json();
        setQueries(data);
      } catch (err: any) {
        console.error("Fetch queries error:", err);
        setError(err.message || "An unknown error occurred.");
        toast.error("Could not load queries: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerQueries();
  }, [supabase]);

  const getAvatarInfo = (query: CustomerQuery) => {
    let initials = "??";
    const name = query.sender_name;
    const email = query.sender_identifier;

    if (name) {
      const nameParts = name.split(" ");
      initials = nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "");
    } else if (email) {
      const emailLocalPart = email.split("@")[0];
      if (emailLocalPart.includes(".")) {
        const nameParts = emailLocalPart.split(".");
        initials = nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "");
      } else if (emailLocalPart.length >= 2) {
        initials = emailLocalPart.substring(0, 2);
      } else {
        initials = emailLocalPart.substring(0, 1);
      }
    }
    const colors = ["bg-blue-200", "bg-green-200", "bg-purple-200", "bg-red-200", "bg-yellow-200", "bg-pink-200", "bg-indigo-200"];
    const colorIndex = query.id.charCodeAt(0) % colors.length;
    return { initials: initials.toUpperCase(), bgColor: colors[colorIndex] };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-muted/20 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading queries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-muted/20 items-center justify-center p-4">
        <p className="text-red-600 font-semibold">Error loading queries:</p>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
      </div>
    );
  }

  return (
    // The parent is a relative container that takes the full height.
    <div className="relative h-full bg-muted/20">
      {/* The header has a fixed height and is positioned normally. */}
      <div
        className="flex items-center border-b px-4" // Using px-4 for horizontal padding
        style={{ height: HEADER_HEIGHT }}
      >
        <h2 className="text-lg font-semibold">Customer Queries ({queries.length})</h2>
      </div>

      {/* The scrollable area's height is calculated to fill the rest of the space. */}
      <div
        className="overflow-y-auto"
        style={{ height: `calc(100% - ${HEADER_HEIGHT})` }}
      >
        {queries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No customer queries yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2"> {/* p-2 for padding inside scroll area */}
            {queries.map((query) => {
              const avatarInfo = getAvatarInfo(query);
              return (
                <div
                  key={query.id}
                  onClick={() => onSelectQuery(query)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-transparent p-3 text-left text-sm transition-all hover:bg-muted/50", // p-3 for item padding
                    "cursor-pointer",
                    selectedQueryId === query.id &&
                      "bg-muted border-border shadow-sm"
                  )}
                >
                  <Avatar className="flex h-9 w-9 items-center justify-center">
                    <div
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-foreground/70",
                        avatarInfo.bgColor
                      )}
                    >
                      {avatarInfo.initials}
                    </div>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold">
                        {query.sender_name || query.sender_identifier}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          selectedQueryId === query.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(query.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="truncate font-medium">
                      {query.subject || "No Subject"}
                    </p>
                    {/* Re-added truncate to body_text for a concise preview */}
                    <p className="text-xs text-muted-foreground truncate">
                      {query.body_text}
                    </p>
                  </div>
                  {/* You could add an unread indicator based on query.status if needed */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
