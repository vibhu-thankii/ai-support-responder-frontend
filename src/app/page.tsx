"use client";

import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { QueryList, type Query } from "@/components/QueryList";
import { QueryDetailView } from "@/components/QueryDetailView";
import { Sidebar } from "@/components/Sidebar";
import { UserNav } from "@/components/UserNav";

const mockQueries: Query[] = [
  {
    id: "q1",
    sender: "john.doe@example.com",
    subject: "Issue with my recent order",
    body: "Hi team, I received my order #12345 today but one of the items was damaged. Can you please help me with a replacement? Thanks, John",
    read: true,
    timestamp: "5m ago",
    avatar: { initials: "JD", bgColor: "bg-blue-200" }
  },
  {
    id: "q2",
    sender: "jane.smith@example.com",
    subject: "Question about your return policy",
    body: "Hello, I'd like to understand your return policy before I make a purchase. How many days do I have to return an item?",
    read: false,
    timestamp: "3h ago",
    avatar: { initials: "JS", bgColor: "bg-green-200" }
  },
  {
    id: "q3",
    sender: "sam.wilson@example.com",
    subject: "Feature Request: Dark Mode",
    body: "I love using your app! It would be amazing if you could add a dark mode option in a future update. Keep up the great work!",
    read: false,
    timestamp: "1d ago",
    avatar: { initials: "SW", bgColor: "bg-purple-200" }
  },
  {
    id: "q4",
    sender: "alpha.customer@network.com",
    subject: "Login Problems on Mobile",
    body: "I'm unable to login to my account using the mobile app. It keeps saying 'Invalid Credentials' but I am sure my password is correct. I can login fine on the website. Please assist.",
    read: true,
    timestamp: "2d ago",
    avatar: { initials: "AC", bgColor: "bg-red-200" }
  },
  {
    id: "q5",
    sender: "support.query@company.net",
    subject: "Urgent: API Integration Failing",
    body: "Our API integration with your service suddenly stopped working about an hour ago. We are getting 500 errors on all calls. This is critical for our operations. We need immediate help. Order ID: XYZ-789, User ID: user_beta_001.",
    read: false,
    timestamp: "3d ago",
    avatar: { initials: "SQ", bgColor: "bg-yellow-200" }
  },
];

export default function Dashboard() {
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  useEffect(() => {
    if (mockQueries.length > 0) {
      setSelectedQuery(mockQueries[0]);
    }
  }, []);

  const handleSelectQuery = (query: Query) => {
    setSelectedQuery(query);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
            <h1 className="text-xl font-semibold">Inbox</h1>
            <UserNav />
        </header>
        <div className="flex-1 overflow-hidden min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full max-w-full">
            {/* The ResizablePanel is now back to its default state */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <QueryList
                    queries={mockQueries}
                    selectedQueryId={selectedQuery?.id}
                    onSelectQuery={handleSelectQuery}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70} minSize={60}>
                <QueryDetailView query={selectedQuery} />
            </ResizablePanel>
            </ResizablePanelGroup>
        </div>
      </main>
    </div>
  );
}