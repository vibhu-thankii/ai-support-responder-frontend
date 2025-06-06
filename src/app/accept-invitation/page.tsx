// src/app/accept-invitation/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";

function AcceptInvitationContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle" | "authenticating">("authenticating");
  const [message, setMessage] = useState<string | null>(null);
  // No longer need isUserLoggedIn state here, as effect handles redirection

  useEffect(() => {
    if (!token) {
      setMessage("Invitation token is missing or invalid.");
      setStatus("error");
      return;
    }

    const processAcceptance = async (currentSession: any) => {
      setStatus("loading");
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/invitations/accept`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentSession.access_token}`,
            },
            body: JSON.stringify({ token }),
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.detail || "Failed to accept invitation.");
        }

        toast.success(responseData.message || "Invitation accepted successfully!");
        setMessage(responseData.message || "Invitation accepted! Redirecting to dashboard...");
        setStatus("success");
        router.push("/dashboard/overview"); // Or simply '/'
        router.refresh(); 
      } catch (err: any) {
        console.error("Accept invitation error:", err);
        setMessage(err.message || "An error occurred while accepting the invitation.");
        setStatus("error");
        toast.error(err.message || "Could not accept invitation.");
      }
    };

    const checkAuthAndProcess = async () => {
        setStatus("authenticating");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError);
            setMessage("Could not verify your login status. Please try again.");
            setStatus("error");
            return;
        }

        if (session) {
            // User is logged in, proceed to accept
            await processAcceptance(session);
        } else {
            // User is not logged in, redirect to login, passing the token and a redirect path
            const redirectPath = `/accept-invitation?token=${token}`;
            router.push(`/login?redirect_path=${encodeURIComponent(redirectPath)}`);
            // The message below might not be seen due to immediate redirect
            // setMessage("Please log in or sign up to accept the invitation.");
            // setStatus("idle"); 
        }
    };

    checkAuthAndProcess();

    // Optional: Listen for auth changes if you want to auto-process after login on this page itself,
    // but typically the redirect from login page back here would trigger the above effect again.
    // const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    //   if (event === "SIGNED_IN" && token && status !== 'loading' && status !== 'success') {
    //     // If user just signed in on this page (e.g. if login was a modal)
    //     // and we haven't started processing or succeeded.
    //     checkAuthAndProcess();
    //   }
    // });

    // return () => {
    //   authListener?.unsubscribe();
    // };

  }, [token, supabase, router]); // Removed status from dependency array to avoid re-triggering on setStatus

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl dark:bg-slate-800/80 dark:border-slate-700/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Accept Invitation</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 min-h-[20px]">
            {status === "loading" && "Processing your invitation..."}
            {status === "authenticating" && "Verifying your login status..."}
            {/* Message for idle might not be seen if redirected quickly */}
            {status === "idle" && "Redirecting to login..."} 
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" || status === "authenticating" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-slate-600 dark:text-slate-400">Please wait...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8 text-green-600 dark:text-green-400">
              <CheckCircle className="h-12 w-12" />
              <p className="font-semibold">{message || "Success!"}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Redirecting you shortly...</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8 text-destructive">
              <XCircle className="h-12 w-12" />
              <p className="font-semibold text-center">{message || "An error occurred."}</p>
              <Link href="/" passHref>
                <Button variant="outline" className="mt-4">Go to Homepage</Button>
              </Link>
            </div>
          )}
           {/* This 'idle' state view for non-logged-in users might not be shown if redirection to /login is immediate */}
           {status === "idle" && ( 
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <p className="text-center text-slate-700 dark:text-slate-300">
                    Redirecting you to login to accept the invitation.
                </p>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// It's good practice to wrap components that use useSearchParams in Suspense
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
