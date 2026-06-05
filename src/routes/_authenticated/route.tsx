import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, Calendar, Grid3x3, Medal, Star, Shield } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) throw redirect({ to: "/auth" });
    return { user: sessionData.session.user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/matches", label: "Meciuri", icon: Calendar },
  { to: "/groups", label: "Grupe", icon: Grid3x3 },
  { to: "/leaderboard", label: "Clasament", icon: Medal },
  { to: "/bonus", label: "Bonus", icon: Star },
] as const;

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

  const navLinkClass = (active: boolean, compact = false) =>
    [
      "rounded-md font-medium transition-colors",
      compact ? "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px]" : "px-3 py-1.5 text-sm",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
    ].join(" ");

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link to="/matches" className="flex min-w-0 items-center gap-2 font-bold">
            <Trophy className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate text-xs sm:text-sm">ORBICO WC2026</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={navLinkClass(path.startsWith(n.to))}>
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={navLinkClass(path.startsWith("/admin"))}>
                Admin
              </Link>
            )}
          </nav>

          <Button variant="ghost" size="icon" className="shrink-0" onClick={signOut} aria-label="Deconectare">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 pb-24 sm:px-4 sm:py-6 md:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-safe backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={navLinkClass(active, true)}>
                <Icon className={`h-5 w-5 ${active ? "" : "opacity-80"}`} />
                <span>{n.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className={navLinkClass(path.startsWith("/admin"), true)}>
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </Link>
          )}
        </div>
      </nav>

      <Toaster position="top-center" />
    </div>
  );
}
