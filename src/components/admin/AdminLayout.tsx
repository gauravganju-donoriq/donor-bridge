import { Outlet } from "react-router-dom";
import AdminNav from "./AdminNav";
import UserMenu from "./UserMenu";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Lonza</span>
            <span className="text-sm text-muted-foreground">Admin Portal</span>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Navigation */}
      <AdminNav />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
