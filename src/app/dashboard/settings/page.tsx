// src/app/dashboard/settings/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { BackButton } from "@/components/BackButton"; // <-- Import BackButton

export default function SettingsPage() {
  const supabase = createClient();
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitApiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!openaiApiKey.trim()) {
      toast.error("OpenAI API Key cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated. Please log in.");
        setIsSubmitting(false); return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/settings/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ openai_api_key: openaiApiKey }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save API key");
      }
      toast.success("OpenAI API Key saved successfully!");
      setOpenaiApiKey(""); 
    } catch (error: any) {
      toast.error(error.message || "An error occurred while saving the API key.");
      console.error("Save API Key error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-4"> {/* <-- Wrapper for BackButton */}
        <BackButton />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Enter your OpenAI API key to enable AI features. Your key will be stored securely.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitApiKey}>
          <CardContent>
            <div>
              <label htmlFor="openai_api_key" className="block text-sm font-medium mb-1">
                API Key
              </label>
              <Input
                id="openai_api_key" type="password" value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Save API Key
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
