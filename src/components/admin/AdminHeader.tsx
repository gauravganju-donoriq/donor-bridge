import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NotificationBell from "./NotificationBell";

const routeTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/donors": "Donors",
  "/admin/donor-approval": "Donor Approval",
  "/admin/appointments": "Appointments",
  "/admin/reports": "Reports",
  "/admin/users": "Users",
  "/admin/logs": "Activity Logs",
};

const AdminHeader = () => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-background border-b">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="text-muted-foreground hover:text-foreground">
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{currentTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: Search & Notifications */}
      <div className="flex items-center gap-3">
        {/* Search (placeholder for future) */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search... (⌘K)"
              className="w-64 pl-9 h-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
};

export default AdminHeader;
