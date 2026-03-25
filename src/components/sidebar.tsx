"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Bot, BarChart3, CheckSquare, Heart, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-center border-b px-6">
        <h2 className="text-2xl font-light tracking-wide text-foreground">Linda</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </div>
  );
}

