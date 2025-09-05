// src/components/TeamManagementModal.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserPlus,
  ShieldX,
  Loader2,
  Users,
  MailCheck,
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
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "./ui/scroll-area";

// Types matching backend Pydantic models
interface OrganizationMember {
  id: string;
  full_name?: string | null;
  email?: string | null;
  joined_at?: string | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface InvitationCreateRequest {
  email: string;
  role: "agent" | "admin";
}

export function TeamManagementModal() {
  const supabase = createClient();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "admin">("agent");

  const fetchTeamData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Authentication required.");
      setIsLoading(false);
      return;
    }
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/members`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/invitations/pending`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (!membersRes.ok) throw new Error("Failed to fetch team members.");
      if (!invitesRes.ok) throw new Error("Failed to fetch pending invitations.");

      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();
      
      setMembers(membersData);
      setPendingInvitations(invitesData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
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
      toast.error("Authentication required.");
      setIsSubmittingInvite(false);
      return;
    }

    const payload: InvitationCreateRequest = { email: inviteEmail, role: inviteRole };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || "Failed to send invitation.");
      
      toast.success(responseData.message || `Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      fetchTeamData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setIsRevoking(invitationId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Authentication required.");
      setIsRevoking(null);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/invitations/${invitationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || "Failed to revoke invitation.");
      
      toast.success(responseData.message || "Invitation revoked!");
      fetchTeamData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRevoking(null);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
        <h2 className="text-lg font-semibold mb-1">Invite New Member</h2>
        <p className="text-sm text-muted-foreground mb-4">
            Enter the email address and role for the new team member.
        </p>
        <form onSubmit={handleInviteUser} className="flex items-end gap-2 mb-8">
            <div className="grid gap-1.5 flex-grow">
                <label htmlFor="invite-email" className="text-sm font-medium">Email</label>
                <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@example.com" disabled={isSubmittingInvite} />
            </div>
            <div className="grid gap-1.5">
                <label htmlFor="invite-role" className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={(value: "agent" | "admin") => setInviteRole(value)} disabled={isSubmittingInvite}>
                    <SelectTrigger id="invite-role" className="w-[120px]">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={isSubmittingInvite}>
                {isSubmittingInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Send Invite
            </Button>
        </form>
        
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5"/>Current Team Members</h3>
                    <ScrollArea className="h-[200px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Joined On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>{member.full_name || "N/A"}</TableCell>
                                        <TableCell>{member.email || "N/A"}</TableCell>
                                        <TableCell>{formatDate(member.joined_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center"><MailCheck className="mr-2 h-5 w-5"/>Pending Invitations</h3>
                     <ScrollArea className="h-[200px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Expires On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingInvitations.map((invite) => (
                                    <TableRow key={invite.id}>
                                        <TableCell>{invite.email}</TableCell>
                                        <TableCell className="capitalize">{invite.role}</TableCell>
                                        <TableCell>{formatDate(invite.expires_at)}</TableCell>
                                        <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isRevoking === invite.id} aria-label="Revoke">
                                                    {isRevoking === invite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldX className="h-4 w-4 text-destructive" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will invalidate the invitation for {invite.email}. They will no longer be able to accept it.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRevokeInvitation(invite.id)} className="bg-destructive hover:bg-destructive/90">
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
                    </ScrollArea>
                </div>
            </div>
        )}
    </div>
  );
}