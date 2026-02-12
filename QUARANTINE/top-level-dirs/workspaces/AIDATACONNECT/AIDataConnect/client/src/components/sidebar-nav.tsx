import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  FolderOpen, 
  Database,
  GitGraph,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  },
  {
    title: "File Explorer",
    href: "/files",
    icon: FolderOpen
  },
  {
    title: "Data Sources",
    href: "/data-sources",
    icon: Database
  },
  {
    title: "Data Pipelines",
    href: "/pipeline",
    icon: GitGraph
  }
];

export function SidebarNav() {
  const [location] = useLocation();

  return (
    <nav className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location === item.href && "bg-muted"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}