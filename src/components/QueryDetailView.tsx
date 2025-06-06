// src/components/QueryDetailView.tsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"; 
import { toast } from "sonner";
import { Copy, Bot, BookOpen, Loader2, Zap, Brain, Info, AlertTriangle, MessageSquare, UserCircle, Sparkles, Send } from "lucide-react"; // Added Send
import { useState, useEffect, useRef } from "react"; 
import { createClient } from "@/lib/supabase/client";
import Link from "next/link"; 
import { cn } from "@/lib/utils"; 

// Main query type (summary of the conversation thread)
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
  updated_at?: string | null; 
  original_created_at?: string | null;
  ai_draft_response?: string | null; 
  ai_response_source?: string | null; 
  ai_retrieved_context_count?: number | null; 
}

// Type for individual messages within a thread
export interface QueryMessage {
    id: string; 
    customer_query_id: string; 
    organization_id: string; 
    sender_type: "customer" | "agent" | "ai_draft" | "system_note";
    sender_identifier?: string | null; 
    body_text: string;
    message_id_header?: string | null;
    in_reply_to_header?: string | null;
    created_at: string; 
}


interface RAGDraftState {
  text: string;
  retrievedContextCount: number | null;
  source: "openai_rag" | "openai_rag_no_context" | "tfidf_retrieval" | "tfidf_retrieval_no_match" | "tfidf_retrieval_failed" | "tfidf_failed" | "no_kb_content" | null;
}

interface QueryDetailViewProps {
  query: CustomerQuery | null; 
}

function DetailViewSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" /> 
        </CardContent>
      </Card>
      <Card className="flex-grow">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="flex-grow">
          <Skeleton className="h-full min-h-[150px]" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    </div>
  );
}

export function QueryDetailView({ query }: QueryDetailViewProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [draft, setDraft] = useState<RAGDraftState>({ text: "", retrievedContextCount: null, source: null });
  const [isLoadingInitialContent, setIsLoadingInitialContent] = useState<boolean>(false); 
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<boolean>(false);
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false); // New state for sending reply
  const [replyText, setReplyText] = useState<string>(""); // State for the reply textarea

  const messagesEndRef = useRef<null | HTMLDivElement>(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

  const fetchMessages = async (currentQueryId: string) => {
    if (!currentQueryId) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication error. Please log in again.");
        setIsLoadingMessages(false);
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/customer-queries/${currentQueryId}/messages`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch messages");
      }
      const data: QueryMessage[] = await response.json();
      setMessages(data);
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      toast.error("Could not load messages: " + err.message);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };


  useEffect(() => {
    if (query) {
      setIsLoadingInitialContent(true);
      setDraft({ text: "", retrievedContextCount: null, source: null }); 
      setReplyText(""); // Clear reply text when query changes
      fetchMessages(query.id); // Fetch messages for the new query
      const timer = setTimeout(() => {
        setIsLoadingInitialContent(false);
      }, 300); 
      return () => clearTimeout(timer);
    } else {
        setMessages([]);
        setDraft({ text: "", retrievedContextCount: null, source: null }); 
        setReplyText("");
    }
  }, [query, supabase]); // Removed fetchMessages from here, will call it directly

  const handleGenerateDraft = async () => {
    if (!query) return;
    const lastCustomerMessage = messages.filter(m => m.sender_type === 'customer').pop();
    const queryTextForAI = lastCustomerMessage?.body_text || query.body_text;

    setIsGeneratingDraft(true);
    setDraft({ text: "", retrievedContextCount: null, source: null }); 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication error. Please log in again.");
        setIsGeneratingDraft(false);
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/generate-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`},
          body: JSON.stringify({ text: queryTextForAI }), 
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server responded with an error");
      }
      const data = await response.json();
      setDraft({
        text: data.generated_response,
        retrievedContextCount: data.retrieved_context_count,
        source: data.source,
      });
      setReplyText(data.generated_response); // Pre-fill reply textarea with AI draft

      if (data.source !== "no_kb_content" && data.source !== "tfidf_failed" && data.source !== "openai_rag_no_context") {
        toast.success("AI Draft Generated Successfully!");
      } else if (data.source === "no_kb_content") {
        toast.info("Knowledge base is empty. Please add content.", {
            description: "The AI needs information to generate relevant responses."
        });
      }
    } catch (err: any) {
      console.error("Failed to generate draft:", err);
      setDraft({ text: `Failed to load draft. Error: ${err.message}`, retrievedContextCount: 0, source: null });
      toast.error("Failed to Generate Draft", { description: err.message });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCopyToClipboard = () => {
    const textToCopy = replyText || draft.text; // Prefer text from reply box
    if (!textToCopy) {
      toast.error("Nothing to copy!");
      return;
    }
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Response copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy text.");
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const renderSourceBadge = () => {
    if (!draft.source || draft.source === "no_kb_content" || !draft.text) return null; // Only show if there's a draft text
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    let IconComponent = Bot;
    let label = "AI Draft";

    switch (draft.source) {
      case "openai_rag":
        badgeVariant = "default"; IconComponent = Zap; label = "OpenAI RAG";
        break;
      case "openai_rag_no_context":
        badgeVariant = "outline"; IconComponent = Zap; label = "OpenAI (No Context)";
        break;
      case "tfidf_retrieval":
        badgeVariant = "secondary"; IconComponent = Brain; label = "Knowledge Base (TF-IDF)";
        break;
      case "tfidf_retrieval_no_match": case "tfidf_retrieval_failed": case "tfidf_failed":
        badgeVariant = "outline"; IconComponent = Brain; label = "KB Search (Limited Info)";
        break;
      default: IconComponent = Bot; label = "AI Generated";
    }
    return (
      <Badge variant={badgeVariant} className="mt-2 flex items-center w-fit text-xs">
        <IconComponent className="mr-1.5 h-3 w-3" />
        {label}
        {(draft.source.includes("rag") || draft.source.includes("tfidf_retrieval")) && draft.retrievedContextCount !== null && draft.retrievedContextCount > 0 && (
          <span className="ml-1.5">({draft.retrievedContextCount} context(s))</span>
        )}
      </Badge>
    );
  };

  const handleSendAgentReply = async () => {
    if (!query || !replyText.trim()) {
      toast.error("Reply text cannot be empty.");
      return;
    }
    setIsSendingReply(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication error. Please log in again.");
        setIsSendingReply(false);
        return;
      }

      const payload = { reply_text: replyText };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/customer-queries/${query.id}/agent-reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send reply");
      }
      toast.success("Reply sent and saved!");
      setReplyText(""); // Clear the reply textarea
      setDraft({ text: "", retrievedContextCount: null, source: null }); // Clear AI draft state
      fetchMessages(query.id); // Re-fetch messages to show the new agent reply
      // Optionally, you might want to update the parent query list's status too.
      // This could be done by passing a callback from QueryList or using a global state.

    } catch (err: any) {
      console.error("Failed to send reply:", err);
      toast.error("Failed to send reply: " + err.message);
    } finally {
      setIsSendingReply(false);
    }
  };


  if (!query) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-muted/20">
        <span className="text-muted-foreground text-center">
          Select a customer query from the list to view details and generate AI responses.
        </span>
      </div>
    );
  }

  if (isLoadingInitialContent) { 
    return <DetailViewSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 border-b p-4">
        <CardTitle className="text-lg md:text-xl">{query.subject || "No Subject"}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          <span>From: {query.sender_name || query.sender_identifier}</span>
          <span className="text-muted-foreground">·</span>
          <span>Channel: <Badge variant="outline" className="text-xs">{query.channel}</Badge></span>
          <span className="text-muted-foreground">·</span>
          <span>Status: <Badge variant={query.status === 'new' || query.status === 'customer_reply' ? 'default' : 'secondary'} className="text-xs">{query.status}</Badge></span>
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-grow min-h-0 bg-slate-50 dark:bg-slate-900/50">
        <div className="p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && query.body_text ? ( 
            <div className={cn("flex mb-4 items-start gap-3 p-3 rounded-lg bg-background shadow-sm border")}>
                <UserCircle className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{query.sender_name || query.sender_identifier} (Initial Message)</span>
                        <span>{new Date(query.received_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm whitespace-pre-line">{query.body_text}</div>
                </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg shadow-sm border text-sm",
                  // Removed agent specific background from here, will apply to inner div
                  message.sender_type === "agent" ? "ml-auto max-w-[85%]" : "max-w-[85%]", 
                )}
              >
                {message.sender_type === "customer" && <UserCircle className="h-7 w-7 text-muted-foreground flex-shrink-0 mt-0.5" />}
                
                <div className={cn("flex-1", message.sender_type === "agent" && "order-first")}> 
                  <div className={cn(
                      "flex items-center text-xs text-muted-foreground mb-1",
                      message.sender_type === "agent" && "justify-end"
                  )}>
                    {message.sender_type === "agent" && <span className="mr-2">{new Date(message.created_at).toLocaleString()}</span>}
                    <span>
                      {message.sender_type === "customer" && (query.sender_name || message.sender_identifier)}
                      {message.sender_type === "agent" && "You (Agent)"}
                      {message.sender_type === "ai_draft" && "AI Draft Suggestion"}
                    </span>
                    {message.sender_type === "customer" && <span className="ml-2">{new Date(message.created_at).toLocaleString()}</span>}
                  </div>
                  {/* Updated background and text color for agent/customer replies */}
                  <div className={cn(
                      "p-2.5 rounded-md whitespace-pre-line",
                      message.sender_type === "customer" 
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200" 
                          : "bg-slate-500 text-slate-50 dark:bg-slate-300 dark:text-slate-800" // Agent: dark bg on light theme, light bg on dark theme
                  )}>
                    {message.body_text}
                  </div>
                </div>
                 {message.sender_type === "agent" && <UserCircle className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" />}
                 {message.sender_type === "ai_draft" && <Sparkles className="h-7 w-7 text-purple-500 flex-shrink-0 mt-0.5" />}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> 
        </div>
      </ScrollArea>

      {/* Reply and AI Draft Section */}
      <Card className="flex-shrink-0 border-t rounded-none mt-auto">
        <CardHeader className="pb-2 pt-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md">Compose Reply / AI Draft</CardTitle>
            {renderSourceBadge()}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {draft.source === "no_kb_content" && !isGeneratingDraft ? ( 
            <div className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md border border-yellow-300 dark:border-yellow-700 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2.5 mt-0.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-medium">Knowledge Base Empty</p>
                <p className="mt-0.5 text-xs">
                  The AI needs information to generate relevant responses.
                  Please <Link href="/dashboard/knowledge-base" className="underline hover:text-yellow-800 dark:hover:text-yellow-300">add content to the Knowledge Base</Link>.
                </p>
              </div>
            </div>
          ) : null}
           <Textarea
              placeholder={
                isGeneratingDraft ? "AI is thinking..." 
                : draft.source === "no_kb_content" ? "Knowledge base is empty. Type your reply manually or add KB content."
                : "Type your reply, or click 'Generate Draft' for an AI suggestion..."
              }
              value={replyText} 
              onChange={(e) => setReplyText(e.target.value)} 
              className="text-sm md:text-base min-h-[100px] resize-none mt-2" 
              disabled={isGeneratingDraft || isSendingReply}
            />
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 pb-3">
          <Button
            onClick={handleGenerateDraft}
            disabled={isGeneratingDraft || isSendingReply}
            variant="outline"
            className="w-full sm:w-auto"
            size="sm"
          >
            {isGeneratingDraft ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            {draft.text || draft.source === "no_kb_content" ? "Regenerate Draft" : "Generate Draft"}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleCopyToClipboard} 
              variant="outline" 
              size="sm"
              className="w-1/2 sm:w-auto"
              disabled={!replyText.trim()} 
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button 
              onClick={handleSendAgentReply} 
              size="sm"
              className="w-1/2 sm:w-auto bg-primary hover:bg-primary/80 text-primary-foreground" 
              disabled={isSendingReply || !replyText.trim() || isGeneratingDraft} 
            >
              {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Reply
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
