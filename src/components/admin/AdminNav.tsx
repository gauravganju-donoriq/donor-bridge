import { NavLink } from "@/components/NavLink";
import { Users, Calendar, FileText, UserCog, ScrollText, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/admin/donors", label: "Donors", icon: Users },
  { to: "/admin/donor-approval", label: "Donor Approval", icon: ClipboardCheck },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/users", label: "Users", icon: UserCog, adminOnly: true },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
];

const AdminNav = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            // Skip admin-only items if user is not admin
            if (item.adminOnly && !isAdmin) return null;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors whitespace-nowrap"
                activeClassName="text-primary border-b-2 border-primary bg-accent/30"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
