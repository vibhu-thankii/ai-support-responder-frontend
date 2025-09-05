// src/app/dashboard/settings/page.tsx
"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle, BrainCircuit, Building, KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeamManagementModal } from "@/components/TeamManagementModal";


type APIKeyStatus = {
  openai: boolean;
  gemini: boolean;
  grok: boolean;
  perplexity: boolean;
  anthropic: boolean;
};

type AIProvider = "openai" | "gemini" | "anthropic" | "grok" | "perplexity";

interface UserProfile {
  full_name?: string | null;
  email?: string | null;
}

interface Organization {
  name?: string | null;
}


export default function SettingsPage() {
const supabase = useMemo(() => createClient(), []);

// State for API Keys section
const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
const [apiKey, setApiKey] = useState("");
const [keyStatuses, setKeyStatuses] = useState<APIKeyStatus | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isLoadingStatus, setIsLoadingStatus] = useState(true);

// State for new profile/org sections
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [organization, setOrganization] = useState<Organization | null>(null);
const [isLoadingProfile, setIsLoadingProfile] = useState(true);


const aiProviders = [
    { id: "openai", name: "OpenAI (ChatGPT)" },
    { id: "gemini", name: "Google Gemini" },
    { id: "anthropic", name: "Anthropic Claude" },
    { id: "grok", name: "Grok" },
    { id: "perplexity", name: "Perplexity" },
] as const;

// Fetch all necessary data on component mount
useEffect(() => {
  const fetchData = async () => {
      setIsLoadingStatus(true);
      setIsLoadingProfile(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          toast.error("Authentication session not found. Please log in again.");
          setIsLoadingStatus(false);
          setIsLoadingProfile(false);
          return;
      }

      // Fetch API Key Statuses
      try {
          const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/settings/api-key-status`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!statusResponse.ok) throw new Error("Failed to fetch API key statuses.");
          const statusData: APIKeyStatus = await statusResponse.json();
          setKeyStatuses(statusData);
      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setIsLoadingStatus(false);
      }
      
      // Fetch Profile and Organization Info
      try {
          // This Supabase query joins the 'organizations' table based on the foreign key in 'profiles'
          const { data: profileData, error } = await supabase
              .from('profiles')
              .select('full_name, organizations(name)')
              .eq('id', session.user.id)
              .single();

          if (error) throw error;
          
          setUserProfile({
              full_name: profileData.full_name,
              email: session.user.email
          });

          const orgData = profileData.organizations as any; // Cast because Supabase join returns object/array
          if (orgData) {
               setOrganization({ name: orgData.name });
          }
      } catch(error: any) {
          toast.error("Could not fetch profile information.");
          console.error("Profile fetch error:", error);
      } finally {
          setIsLoadingProfile(false);
      }
  };

  fetchData();
}, [supabase]);


const handleSubmitApiKey = async (e: FormEvent) => {
  e.preventDefault();
  if (!apiKey.trim()) {
    toast.info("Please enter an API key to save.");
    return;
  }

  setIsSubmitting(true);
  try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          toast.error("Not authenticated. Please log in.");
          return;
      }

      const payload = {
          provider: selectedProvider,
          api_key: apiKey
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/settings/api-keys`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to save API key.");
      }
      
      const result = await response.json();
      toast.success(result.message || "API Key saved successfully!");
      
      // Re-fetch statuses to update the UI
      setIsLoadingStatus(true);
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/settings/api-key-status`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const statusData: APIKeyStatus = await statusResponse.json();
      setKeyStatuses(statusData);
      setIsLoadingStatus(false);

      setApiKey(""); // Clear input field

  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">
        Manage your account, organization, and AI provider settings.
      </p>
    </div>
    <Separator />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* PROFILE & ORGANIZATION CARDS */}
      <div className="lg:col-span-1 space-y-8">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                   {isLoadingProfile ? (
                      <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                      </div>
                   ) : (
                      <div>
                          <p className="font-medium text-foreground">{userProfile?.full_name || "User"}</p>
                          <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                      </div>
                   )}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> Organization</CardTitle>
              </CardHeader>
              <CardContent>
                  {isLoadingProfile ? (
                      <div className="h-5 bg-muted rounded w-1/2 animate-pulse"></div>
                  ) : (
                      <p className="text-lg font-semibold text-foreground">{organization?.name || "Your Organization"}</p>
                  )}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Team Management</CardTitle>
                  <CardDescription>Invite new members and manage roles within your organization.</CardDescription>
              </CardHeader>
              <CardFooter>
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button>Manage Team</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                          <DialogHeader>
                              <DialogTitle>Team Management</DialogTitle>
                          </DialogHeader>
                          <TeamManagementModal />
                      </DialogContent>
                  </Dialog>
              </CardFooter>
          </Card>

      </div>

      {/* API KEYS CARD */}
      <div className="lg:col-span-2">
          <Card>
              <form onSubmit={handleSubmitApiKey}>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/>AI Provider API Keys</CardTitle>
                  <CardDescription className="mt-2">
                  Select an AI provider and enter your API key. Your key is encrypted and stored securely. 
                  The system will use the first available key from the list.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6"> {/* Increased spacing */}
                  <div className="space-y-2 mt-5">
                      <Label htmlFor="ai-provider">AI Provider</Label>
                      <Select value={selectedProvider} onValueChange={(value: AIProvider) => setSelectedProvider(value)}>
                          <SelectTrigger id="ai-provider" className="w-full md:w-[320px]">
                              <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                          <SelectContent>
                              {aiProviders.map(provider => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                      <div className="flex items-center gap-2">
                                          {provider.name}
                                          {isLoadingStatus ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin"/> :
                                          keyStatuses?.[provider.id] && <CheckCircle className="h-4 w-4 text-green-500"/>}
                                      </div>
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                          id="api-key"
                          name="api-key"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={`Enter your ${aiProviders.find(p => p.id === selectedProvider)?.name} API Key`}
                          disabled={isSubmitting}
                      />
                  </div>
              </CardContent>
              <CardFooter>
                  <Button type="submit" disabled={isSubmitting} className="mt-5">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save API Key
                  </Button>
              </CardFooter>
              </form>
          </Card>
      </div>
    </div>
  </div>
);
}

