// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // To highlight active link
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Inbox, 
  Settings, 
  Sparkles, 
  User, 
  BookMarked, 
  LayoutDashboard,
  UserCog
   // Icon for Dashboard Overview
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
}

function NavLink({ href, icon: Icon, label, currentPath }: NavLinkProps) {
  const isActive = currentPath === href || (href === "/dashboard/overview" && currentPath === "/"); // Treat root as overview for active state
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-foreground",
            isActive
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground hover:bg-muted/50"
          )}
          aria-label={label}
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}


export function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard/overview", icon: LayoutDashboard, label: "Dashboard Overview" },
    { href: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
    { href: "/dashboard/knowledge-base", icon: BookMarked, label: "Knowledge Base" },
    { href: "/dashboard/customers", icon: User, label: "Customers" }, // Corrected href
    { href: "/dashboard/settings/team", icon: UserCog, label: "Team Management" },
  ];

  const bottomNavLinks = [
     { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r bg-background dark:bg-slate-900 dark:border-slate-700">
      <TooltipProvider>
        <div className="flex h-16 w-full items-center justify-center border-b dark:border-slate-700">
          <Link href="/dashboard/overview" aria-label="Home">
            <Sparkles className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <nav className="flex flex-col items-center gap-3 py-4">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} currentPath={pathname} />
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-3 py-4">
           {bottomNavLinks.map((link) => (
            <NavLink key={link.href} {...link} currentPath={pathname} />
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  );
}