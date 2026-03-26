"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Bot, BarChart3, CheckSquare, Heart, Link as LinkIcon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const navigation = [
  {
    name: "Entries Logged",
    href: "/storage",
    icon: FileText,
  },
  {
    name: "Vocabulary",
    href: "/vocabulary",
    icon: BookOpen,
  },
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Bot,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Date Ideas",
    href: "/date-ideas",
    icon: Heart,
  },
  {
    name: "Doc Links",
    href: "/doc-links",
    icon: LinkIcon,
  },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-center border-b px-6">
        <h2 className="text-2xl font-light tracking-wide text-foreground">Linda</h2>
      </div>
      <NavLinks />
    </div>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex h-14 items-center border-b bg-card px-4">
      <button
        onClick={() => setOpen(true)}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h2 className="flex-1 text-center text-xl font-light tracking-wide text-foreground">
        Linda
      </h2>
      <div className="w-9" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="flex h-16 items-center justify-center border-b px-6">
            <SheetTitle className="text-2xl font-light tracking-wide">Linda</SheetTitle>
          </SheetHeader>
          <NavLinks onClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

