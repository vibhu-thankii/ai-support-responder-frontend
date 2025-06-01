"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Inbox, Settings, Sparkles, User } from "lucide-react"

export function Sidebar() {
    return (
        <aside className="flex h-screen w-16 flex-col items-center border-r bg-background">
            <TooltipProvider>
                <div className="flex h-16 w-full items-center justify-center border-b">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <nav className="flex flex-col items-center gap-4 py-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Inbox className="h-5 w-5" />
                                <span className="sr-only">Inbox</span>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent side="right">Inbox</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Customers</span>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent side="right">Customers</TooltipContent>
                    </Tooltip>
                </nav>
                 <nav className="mt-auto flex flex-col items-center gap-4 py-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground">
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                 </nav>
            </TooltipProvider>
        </aside>
    )
}