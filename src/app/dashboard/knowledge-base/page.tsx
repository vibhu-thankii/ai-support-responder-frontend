// src/app/dashboard/knowledge-base/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client"; 
import { Button } from "@/components/ui/button";
// Input is not used for ingest form anymore, Textarea is.
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially long content display
import { toast } from "sonner";
import { PlusCircle, Trash2, Loader2, FileText, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface KBEntry {
  id?: string; // Is a UUID, so string
  content: string;
  // keywords: string[]; // Deprecated
  // response: string; // Deprecated
  created_at?: string; // Assuming backend sends this
  organization_id?: string;
}

export default function KnowledgeBasePage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newContent, setNewContent] = useState("");

  const fetchKBEntries = async () => { // Renamed for clarity
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/knowledge-base`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch knowledge base entries");
      }
      const data: KBEntry[] = await response.json();
      setEntries(data);
    } catch (error: any) {
      toast.error(error.message || "An error occurred while fetching entries.");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestContent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error("Content cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated. Please log in.");
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/knowledge-base/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check for specific OpenAI quota error from backend if possible
        if (errorData.detail && typeof errorData.detail === 'string' && errorData.detail.includes("insufficient_quota")) {
            toast.error("Failed to process content with AI due to OpenAI quota issues. Content saved without AI embedding.", {duration: 6000});
        } else {
            throw new Error(errorData.detail || "Failed to ingest new content");
        }
      } else {
        toast.success("Content ingested successfully!");
      }
      setNewContent("");
      fetchKBEntries(); 
    } catch (error: any) {
      if (!error.message.includes("insufficient_quota")) { // Avoid double toasting for quota
        toast.error(error.message || "An error occurred while ingesting content.");
      }
      console.error("Ingest error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entryId?: string) => {
    if (!entryId) {
        toast.error("Cannot delete entry: ID is missing.");
        return;
    }
    // Confirmation dialog is handled by AlertDialogTrigger
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated. Please log in.");
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/knowledge-base/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete entry");
      }
      toast.success("Entry deleted successfully!");
      fetchKBEntries(); 
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the entry.");
      console.error("Delete error:", error);
    }
  };

  useEffect(() => {
    fetchKBEntries();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base Management</h2>
      </div>
      
      <Card className="dark:bg-slate-800/70 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Ingest New Content
          </CardTitle>
          <CardDescription>
            Add new information, FAQs, or product details to your organization's knowledge base. 
            The AI will use this content to generate responses.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleIngestContent}>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="newContent" className="block text-sm font-medium mb-1">
                Content / Document Text
              </label>
              <Textarea
                id="newContent"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste or type your knowledge base content here. This could be a paragraph, an FAQ answer, or product information..."
                rows={6}
                disabled={isSubmitting}
                className="dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-500 dark:text-slate-100"
              />
            </div>
          </CardContent>
          {/* Added mt-4 (margin-top) to the CardFooter for spacing */}
          <CardFooter className="mt-4"> 
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Ingest Content
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-8 dark:bg-slate-800/70 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-xl">Ingested Knowledge Base Entries</CardTitle>
          <CardDescription>
            View and manage the content currently in your organization's knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                <Info className="h-10 w-10 mb-3 text-primary"/>
                <p className="font-medium">Your knowledge base is currently empty.</p>
                <p className="text-sm">Use the form above to ingest your first piece of content.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border dark:border-slate-700"> {/* Added ScrollArea for long lists */}
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-700">
                    <TableHead className="w-[70%]">Content Snippet</TableHead>
                    <TableHead>Ingested On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="dark:border-slate-700">
                      <TableCell className="max-w-xl">
                        <p className="truncate text-sm text-muted-foreground hover:text-foreground transition-colors" title={entry.content}>
                            {entry.content}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/80"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="dark:text-slate-100">Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription className="dark:text-slate-400">
                                This action cannot be undone. This will permanently delete this
                                knowledge base entry.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:border-slate-600">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
