import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, Calendar, Grid3x3, Medal, Star, Shield } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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

  const navClass = (active: boolean, compact = false) =>
    cn(
      "font-semibold transition-all",
      compact
        ? "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px]"
        : "rounded-full px-4 py-2 text-sm",
      compact
        ? active
          ? "text-white"
          : "text-white/60"
        : active
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/75 hover:bg-white/10 hover:text-white",
    );

  return (
    <div className="min-h-screen-safe app-shell-bg">
      <header className="sticky top-0 z-40 bg-gradient-hermes pt-safe shadow-[var(--shadow-elegant)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <Link to="/matches" className="flex min-w-0 items-center gap-2.5 font-bold text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
              <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-semibold uppercase tracking-wider text-white/70">
                ORBICO MOLDOVA
              </span>
              <span className="block truncate text-sm sm:text-base">World Cup 2026</span>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={navClass(path.startsWith(n.to))}>
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={navClass(path.startsWith("/admin"))}>
                Admin
              </Link>
            )}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={signOut}
            aria-label="Deconectare"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Accent stripe — paletă oficială */}
        <div className="flex h-1">
          <div className="h-full flex-1 bg-[var(--wc-hermes)]" />
          <div className="h-full flex-1 bg-[var(--wc-green)]" />
          <div className="h-full flex-1 bg-[var(--wc-red)]" />
          <div className="h-full flex-1 bg-[var(--wc-light-gray)]" />
          <div className="h-full flex-1 bg-[var(--wc-dark-gray)]" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-5 pb-24 sm:px-4 sm:py-8 md:pb-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gradient-hermes pb-safe md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={navClass(active, true)}>
                <Icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
                <span>{n.label}</span>
                {active && <span className="h-0.5 w-4 rounded-full bg-[var(--wc-green)]" />}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className={navClass(path.startsWith("/admin"), true)}>
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
