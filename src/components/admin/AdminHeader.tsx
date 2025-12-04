import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeTitles: Record<string, string> = {
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

        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* Notification badge - uncomment when implementing */}
          {/* <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" /> */}
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
