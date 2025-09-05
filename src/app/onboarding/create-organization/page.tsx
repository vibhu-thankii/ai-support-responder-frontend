// src/app/onboarding/create-organization/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Building } from "lucide-react";

export default function CreateOrganizationPage() {
  const supabase = createClient();
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Check if user is logged in, if not, redirect to login
    // Also check if user ALREADY has an organization, if so, redirect to dashboard
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no row found
        console.error("Error fetching profile for onboarding:", error);
        toast.error("Error checking user status. Please try logging in again.");
        router.push("/login");
        return;
      }

      if (profile && profile.organization_id) {
        // User already has an organization, redirect to dashboard
        toast.info("You already belong to an organization.");
        router.push("/");
        return;
      }
      setIsLoadingUser(false);
    };
    checkUserStatus();
  }, [supabase, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      toast.error("Organization name cannot be empty.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated. Please log in.");
        setIsSubmitting(false);
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: organizationName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create organization");
      }

      const newOrgData = await response.json();
      toast.success(`Organization "${newOrgData.name}" created successfully!`);
      
      router.push("/"); 
      router.refresh(); 

    } catch (error: any) {
      toast.error(error.message || "An error occurred while creating the organization.");
      console.error("Create organization error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <Building className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold text-slate-100">Welcome to Responder AI!</CardTitle>
          <CardDescription className="text-slate-400">
            Let's get your organization set up. Please enter a name for your organization.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4"> {/* Reduced space-y-6 to space-y-4 for tighter content */}
            <div className="space-y-2">
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-300">
                Organization Name
              </label>
              <Input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g., Acme Corp, Support Innovators"
                disabled={isSubmitting}
                // Adjusted input styling for better distinction
                className="bg-slate-700/70 border-slate-600 placeholder-slate-500 text-slate-100 focus:ring-primary focus:border-primary rounded-md shadow-sm"
                required
              />
            </div>
          </CardContent>
          {/* Added margin-top to CardFooter for spacing */}
          <CardFooter className="mt-6"> 
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-md shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building className="mr-2 h-4 w-4" />
              )}
              Create Organization
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 text-center text-xs text-slate-500">
        You can change your organization details later in the settings.
      </p>
    </div>
  );
}
