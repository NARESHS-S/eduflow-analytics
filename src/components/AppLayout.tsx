import { useAuth } from "@/lib/auth-context";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, LayoutDashboard, Plus, BarChart3, LogOut, FileText, MessageSquare
} from "lucide-react";

const teacherLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tests/create", label: "Create Test", icon: Plus },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

const studentLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tests", label: "Available Tests", icon: FileText },
  { to: "/my-results", label: "My Results", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const AppLayout = () => {
  const { user, role, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card">
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none">ExamFlow</h2>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
