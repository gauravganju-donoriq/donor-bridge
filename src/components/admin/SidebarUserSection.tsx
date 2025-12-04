import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarUserSectionProps {
  collapsed: boolean;
}

const SidebarUserSection = ({ collapsed }: SidebarUserSectionProps) => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "default";
      case "staff":
        return "secondary";
      default:
        return "outline";
    }
  };

  const userTrigger = (
    <button
      className={cn(
        "flex items-center w-full p-3 rounded-lg transition-colors",
        "hover:bg-sidebar-accent text-sidebar-foreground",
        collapsed ? "justify-center" : "gap-3"
      )}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
          {user?.email ? getInitials(user.email) : "U"}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          {userRole && (
            <Badge
              variant={getRoleBadgeVariant(userRole)}
              className="text-xs capitalize mt-0.5"
            >
              {userRole}
            </Badge>
          )}
        </div>
      )}
    </button>
  );

  return (
    <div className="border-t border-sidebar-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>{userTrigger}</TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{user?.email}</p>
                {userRole && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            userTrigger
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? "center" : "end"}
          side="top"
          className="w-56 mb-2"
        >
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium truncate">{user?.email}</span>
              {userRole && (
                <span className="text-xs text-muted-foreground capitalize">
                  Role: {userRole}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserSection;
