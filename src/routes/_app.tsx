import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandLink } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="font-display tracking-[0.4em] text-gold animate-pulse">LOADING…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-xs tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              PROJECTS
            </Link>
            <span className="text-xs tracking-widest text-muted-foreground hidden md:inline">
              {user.email}
            </span>
            <Button onClick={() => { signOut(); navigate({ to: "/" }); }} variant="ghost" size="sm" className="tracking-widest">
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> SIGN OUT
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
    </div>
  );
}
