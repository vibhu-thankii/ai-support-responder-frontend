"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress"; // <-- Import Progress
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useState, useEffect } from "react";

type Query = {
  id: string; sender: string; subject: string; body: string;
};

// --- New state shape for the AI draft ---
interface DraftState {
  text: string;
  confidence: number | null;
}

interface QueryDetailViewProps {
  query: Query | null;
}

function DetailViewSkeleton() { /* ... skeleton code remains the same ... */ return(<div className="flex flex-col h-full p-4 md:p-6 space-y-4"><Card><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card><Card className="flex-grow"><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent className="flex-grow"><Skeleton className="h-full min-h-[150px]" /></CardContent><CardFooter className="flex justify-between"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /></CardFooter></Card></div>); }

export function QueryDetailView({ query }: QueryDetailViewProps) {
  // --- Updated state to hold the response object ---
  const [draft, setDraft] = useState<DraftState>({ text: "", confidence: null });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      setDraft({ text: "", confidence: null }); // Clear previous draft
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  const handleGenerateDraft = async () => {
    if (!query) return;
    setIsGenerating(true);
    setDraft({ text: "", confidence: null }); // Clear previous draft
    try {
      // --- CHANGE THIS LINE ---
      const response = await fetch("https://ai-support-responder-backend.onrender.com/api/generate-response", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: query.body }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      // --- Set the new state with both text and confidence ---
      setDraft({ text: data.response, confidence: data.confidence });
      toast.success("AI Draft Generated Successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setDraft({ text: `Failed to load draft. Error: ${errorMessage}`, confidence: 0 });
      toast.error("Failed to Generate Draft", { description: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft.text) { toast.error("Nothing to copy!"); return; }
    navigator.clipboard.writeText(draft.text);
    toast.success("Draft response copied to clipboard!");
  };
  
  // Helper to format confidence and get progress bar color
  const getConfidenceInfo = (score: number | null) => {
    if (score === null) return null;
    const percentage = Math.round(score * 100);
    const color = percentage > 80 ? "bg-green-500" : percentage > 60 ? "bg-yellow-500" : "bg-red-500";
    return { percentage, color };
  };

  const confidenceInfo = getConfidenceInfo(draft.confidence);

  if (!query) return <div className="flex h-full items-center justify-center p-6 bg-muted/30"><span className="text-muted-foreground">Select a query.</span></div>;
  if (isLoading) return <DetailViewSkeleton />;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow min-h-0">
        <div className="p-4 md:p-6 space-y-4">
          <Card className="flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">{query.subject}</CardTitle>
              <CardDescription>From: {query.sender}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm rounded-md border p-3 bg-muted/20 min-h-[120px]">{query.body}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">AI Draft Response</CardTitle>
               {/* --- New Confidence Score Display --- */}
              {confidenceInfo && (
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence Score</span>
                    <span>{confidenceInfo.percentage}%</span>
                  </div>
                  <Progress value={confidenceInfo.percentage} className={`h-2 [&>div]:${confidenceInfo.color}`} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={isGenerating ? "The AI is thinking..." : "AI-generated response will appear here..."}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                className="text-sm md:text-base min-h-[250px] resize-none"
                readOnly={isGenerating}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t bg-background p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <Button onClick={handleGenerateDraft} disabled={isGenerating} variant="outline" className="w-full sm:w-auto">
              {isGenerating ? "Generating..." : "Regenerate Draft"}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleCopy} variant="outline" className="w-1/2 sm:w-auto"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
              <Button className="w-1/2 sm:w-auto">Send (Mock)</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
