"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export type Query = {
  id: string;
  sender: string;
  subject: string;
  body: string;
  read: boolean;
  timestamp: string;
  avatar: {
    initials: string;
    bgColor: string;
  };
};

interface QueryListProps {
  queries: Query[];
  selectedQueryId?: string | null;
  onSelectQuery: (query: Query) => void;
}

export function QueryList({ queries, selectedQueryId, onSelectQuery }: QueryListProps) {
  // We define the header height as a variable to ensure it's consistent.
  const HEADER_HEIGHT = '60px';

  return (
    // The parent is a relative container that takes the full height.
    <div className="relative h-full bg-muted/20">
      
      {/* The header has a fixed height and is positioned normally. */}
      <div
        className="flex items-center border-b px-4"
        style={{ height: HEADER_HEIGHT }}
      >
        <h2 className="text-lg font-semibold">All Messages ({queries.length})</h2>
      </div>

      {/* The scrollable area's height is calculated to fill the rest of the space. */}
      <div
        className="overflow-y-auto"
        style={{ height: `calc(100% - ${HEADER_HEIGHT})` }}
      >
        <div className="flex flex-col gap-1 p-2">
          {queries.map((query) => (
            <div
              key={query.id}
              onClick={() => onSelectQuery(query)}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-transparent p-3 text-left text-sm transition-all hover:bg-muted/50",
                "cursor-pointer",
                selectedQueryId === query.id && "bg-muted border-border shadow-sm"
              )}
            >
              <Avatar className="flex items-center justify-center h-9 w-9">
                <div className={cn("flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-foreground/70", query.avatar.bgColor)}>
                  {query.avatar.initials}
                </div>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{query.sender}</p>
                  <p className={cn(
                      "text-xs",
                      selectedQueryId === query.id ? "text-foreground" : "text-muted-foreground"
                    )}>{query.timestamp}</p>
                </div>
                <p className="font-medium truncate">{query.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{query.body}</p>
              </div>
              {!query.read && (
                 <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}