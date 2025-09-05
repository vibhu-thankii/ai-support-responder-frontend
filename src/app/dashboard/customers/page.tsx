// src/app/customers/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Customer {
  email: string;
  name?: string | null;
  total_queries: number;
  last_contact?: string | null;
}

const getInitials = (name?: string | null, email?: string): string => {
  if (name) {
    const nameParts = name.split(" ");
    return (
      nameParts[0][0] +
      (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")
    ).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "??";
};

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Not authenticated. Please log in.");
          return;
        }

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          }/api/customers`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch customers.");
        }

        const data: Customer[] = await response.json();
        setCustomers(data);
      } catch (err: any) {
        toast.error(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [supabase]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Card className="dark:bg-slate-800/70 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="mr-3 h-6 w-6 text-primary" />
            Customers
          </CardTitle>
          <CardDescription>
            A list of all customers who have contacted you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Queries</TableHead>
                  <TableHead>Last Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.email}>
                      <TableCell>
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(customer.name, customer.email)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.name || "N/A"}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.total_queries}</TableCell>
                      <TableCell>
                        {customer.last_contact
                          ? new Date(customer.last_contact).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td className="h-24 text-center" colSpan={5}>
                      No customers found.
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}