// src/app/dashboard/settings/team/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PlusCircle,
  Trash2,
  Loader2,
  Users,
  MailCheck,
  UserPlus,
  ArrowLeft,
  UserCog,
  ShieldX, // Icon for Revoke
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"; // Ensure AlertDialog is imported

// Types matching backend Pydantic models
interface OrganizationMember {
  id: string; // UUID as string
  full_name?: string | null;
  email?: string | null;
  joined_at?: string | null; // Assuming ISO string date
}

interface PendingInvitation {
  id: string; // UUID as string
  email: string;
  role: string;
  status: string;
  created_at: string; // Assuming ISO string date
  expires_at: string; // Assuming ISO string date
  invited_by_user_id?: string | null;
}

interface InvitationCreateRequest {
  email: string;
  role: "agent" | "admin"; // Enforce role types
}

export default function TeamManagementPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null); // Stores ID of invite being revoked

  // Form state for new invitation
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "admin">("agent");

  const fetchTeamData = async () => {
    setIsLoadingMembers(true);
    setIsLoadingInvitations(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Authentication required.");
      setIsLoadingMembers(false);
      setIsLoadingInvitations(false);
      return;
    }

    // Fetch members
    try {
      const membersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/members`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (!membersResponse.ok) {
        const err = await membersResponse.json();
        throw new Error(err.detail || "Failed to fetch team members.");
      }
      const membersData: OrganizationMember[] = await membersResponse.json();
      setMembers(membersData);
    } catch (error: any) {
      toast.error(error.message || "Error fetching team members.");
      console.error("Fetch members error:", error);
    } finally {
      setIsLoadingMembers(false);
    }

    // Fetch pending invitations
    try {
      const invitesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/invitations/pending`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (!invitesResponse.ok) {
        const err = await invitesResponse.json();
        throw new Error(err.detail || "Failed to fetch pending invitations.");
      }
      const invitesData: PendingInvitation[] = await invitesResponse.json();
      setPendingInvitations(invitesData);
    } catch (error: any) {
      toast.error(error.message || "Error fetching pending invitations.");
      console.error("Fetch invites error:", error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleInviteUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Email address cannot be empty.");
      return;
    }
    setIsSubmittingInvite(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Authentication required to send invitations.");
      setIsSubmittingInvite(false);
      return;
    }

    const payload: InvitationCreateRequest = {
      email: inviteEmail,
      role: inviteRole,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json(); // Always try to parse JSON
      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to send invitation.");
      }
      toast.success(responseData.message || `Invitation sent successfully to ${inviteEmail}!`);
      setInviteEmail("");
      setInviteRole("agent");
      fetchTeamData(); // Refresh both lists
    } catch (error: any) {
      toast.error(error.message || "Error sending invitation.");
      console.error("Invite error:", error);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setIsRevoking(invitationId);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Authentication required to revoke invitations.");
      setIsRevoking(null);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to revoke invitation.");
      }
      toast.success(responseData.message || "Invitation revoked successfully!");
      fetchTeamData(); // Refresh lists
    } catch (error: any) {
      toast.error(error.message || "Error revoking invitation.");
      console.error("Revoke error:", error);
    } finally {
      setIsRevoking(null);
    }
  };


  useEffect(() => {
    fetchTeamData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed supabase from dependency array as createClient() should be stable if memoized or global

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 text-foreground"> {/* Added text-foreground for base text color */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings" passHref>
          <Button variant="outline" size="icon" aria-label="Go back to Settings" className="dark:text-slate-100 dark:border-slate-600 hover:dark:bg-slate-700">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-500 dark:text-slate-200">Team Management</h1>
      </div>

      {/* Invite New User Card */}
      <Card className="bg-card text-card-foreground dark:bg-slate-800/70 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-500 dark:text-slate-100">
            <UserPlus className="h-5 w-5" /> Invite New Member
          </CardTitle>
          <CardDescription className="text-muted-foreground"> {/* Use muted-foreground for descriptions */}
            Enter the email address and role for the new team member. Invitation is valid for 7 days.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleInviteUser}>
          <CardContent className="space-y-4">
            {/* Removed items-end from this grid for default stretch alignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
              <div className="md:col-span-2 space-y-1.5">
                <label htmlFor="invite-email" className="block text-sm font-medium text-foreground"> {/* Use text-foreground */}
                  Email Address
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  disabled={isSubmittingInvite}
                  className="bg-background dark:bg-slate-700/70 border-border dark:border-slate-600 placeholder:text-muted-foreground dark:placeholder-slate-500 text-foreground dark:text-slate-100 rounded-md shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="invite-role" className="block text-sm font-medium text-foreground"> {/* Use text-foreground */}
                  Role
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={(value: "agent" | "admin") => setInviteRole(value)}
                  disabled={isSubmittingInvite}
                >
                  <SelectTrigger 
                    id="invite-role" 
                    className="w-full bg-background dark:bg-slate-700/70 border-border dark:border-slate-600 text-foreground dark:text-slate-100 rounded-md shadow-sm"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-4">
            <Button 
              type="submit" 
              disabled={isSubmittingInvite} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md shadow-lg"
            >
              {isSubmittingInvite ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Current Team Members Card */}
      <Card className="bg-card text-card-foreground dark:bg-slate-800/70 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-500 dark:text-slate-100">
            <Users className="h-5 w-5" /> Current Team Members
          </CardTitle>
          <CardDescription className="text-muted-foreground"> {/* Use muted-foreground */}
            List of users currently in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No team members found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="text-muted-foreground">Name</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-muted-foreground">Email</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-muted-foreground">Joined On</TableHead> {/* Use muted-foreground */}
                  {/* <TableHead className="text-muted-foreground">Role</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="dark:border-slate-700">
                    <TableCell className="text-foreground">{member.full_name || "N/A"}</TableCell> {/* Use text-foreground */}
                    <TableCell className="text-foreground">{member.email || "N/A"}</TableCell> {/* Use text-foreground */}
                    <TableCell className="text-foreground">{formatDate(member.joined_at)}</TableCell> {/* Use text-foreground */}
                    {/* <TableCell className="text-foreground">{member.role}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      <Card className="bg-card text-card-foreground dark:bg-slate-800/70 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-500 dark:text-slate-100">
            <MailCheck className="h-5 w-5" /> Pending Invitations
          </CardTitle>
          <CardDescription className="text-muted-foreground"> {/* Use muted-foreground */}
            Invitations that have been sent but not yet accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvitations ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No pending invitations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="text-muted-foreground">Email</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-muted-foreground">Role</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-muted-foreground">Sent On</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-muted-foreground">Expires On</TableHead> {/* Use muted-foreground */}
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead> {/* Use muted-foreground */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invite) => (
                  <TableRow key={invite.id} className="dark:border-slate-700">
                    <TableCell className="text-foreground">{invite.email}</TableCell> {/* Use text-foreground */}
                    <TableCell className="capitalize text-foreground">{invite.role}</TableCell> {/* Use text-foreground */}
                    <TableCell className="text-foreground">{formatDate(invite.created_at)}</TableCell> {/* Use text-foreground */}
                    <TableCell className="text-foreground">{formatDate(invite.expires_at)}</TableCell> {/* Use text-foreground */}
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isRevoking === invite.id} aria-label="Revoke invitation">
                            {isRevoking === invite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldX className="h-4 w-4 text-destructive" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Revoke Invitation?</AlertDialogTitle> {/* Use text-foreground */}
                            <AlertDialogDescription className="text-muted-foreground"> {/* Use muted-foreground */}
                              Are you sure you want to revoke the invitation for {invite.email}? 
                              They will no longer be able to accept it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeInvitation(invite.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
