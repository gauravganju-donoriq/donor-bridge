import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import {
  Users,
  Calendar,
  FileText,
  UserCog,
  ScrollText,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Dna,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SidebarUserSection from "./SidebarUserSection";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/donors", label: "Donors", icon: Users },
  { to: "/admin/donor-approval", label: "Donor Approval", icon: ClipboardCheck },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/reports", label: "Reports", icon: FileText },
];

const adminItems = [
  { to: "/admin/users", label: "Users", icon: UserCog },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
];

const AdminSidebar = () => {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const linkContent = (
      <NavLink
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}
        activeClassName="bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
          <Dna className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">Lonza</span>
            <span className="text-xs text-sidebar-foreground/60">Donor Management</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Main
            </span>
          )}
          <div className="space-y-1 mt-2">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-1 pt-4">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Admin
              </span>
            )}
            <div className="space-y-1 mt-2">
              {adminItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <SidebarUserSection collapsed={collapsed} />

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
