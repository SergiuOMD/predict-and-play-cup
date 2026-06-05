import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/matches", label: "Meciuri" },
  { to: "/groups", label: "Grupe" },
  { to: "/leaderboard", label: "Clasament" },
  { to: "/bonus", label: "Bonus" },
];

function AuthedLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email;
      if (!email) return;
      const { data: admins } = await supabase
        .from("admins")
        .select("email")
        .ilike("email", email);
      setIsAdmin(!!admins && admins.length > 0);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/matches" className="flex items-center gap-2 font-bold">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">OMD WC2026</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  path.startsWith(n.to) ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  path.startsWith("/admin") ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6"><Outlet /></main>
      <Toaster />
    </div>
  );
}
