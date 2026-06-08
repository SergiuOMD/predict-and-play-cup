import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RegulamentContent } from "@/components/app/regulament-content";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ScrollText, Trophy, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/regulament")({
  ssr: false,
  head: () => ({ meta: [{ title: "Regulament · OMD WC2026" }] }),
  component: RegulamentPage,
});

function RegulamentPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  if (loggedIn) {
    return (
      <div className="min-h-screen-safe app-shell-bg">
        <header className="sticky top-0 z-40 bg-gradient-hermes pt-safe shadow-[var(--shadow-elegant)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <Link to="/matches" className="flex min-w-0 items-center gap-2.5 font-bold text-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
              </div>
              <span className="truncate text-sm sm:text-base">World Cup 2026</span>
            </Link>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/matches">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Înapoi
              </Link>
            </Button>
          </div>
          <div className="flex h-1">
            <div className="h-full flex-1 bg-[var(--wc-hermes)]" />
            <div className="h-full flex-1 bg-[var(--wc-green)]" />
            <div className="h-full flex-1 bg-[var(--wc-red)]" />
            <div className="h-full flex-1 bg-[var(--wc-light-gray)]" />
            <div className="h-full flex-1 bg-[var(--wc-dark-gray)]" />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-3 py-6 pb-10 sm:px-4 sm:py-8">
          <PageHeader
            title="Regulament"
            description="Regulile totalizatorului ORBICO MOLDOVA World Cup 2026."
            icon={<ScrollText className="h-5 w-5 text-white" />}
          />
          <RegulamentContent />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-[oklch(0.16_0.05_260)] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-bold">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-gold shadow-[var(--shadow-gold)]">
              <Trophy className="h-5 w-5 text-[oklch(0.22_0.08_260)]" />
            </div>
            <span className="truncate text-sm sm:text-base">ORBICO MOLDOVA WORLD CUP 2026</span>
          </Link>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-gold font-semibold shadow-[var(--shadow-gold)]">
              <Link to="/auth" search={{ tab: "signup" }}>Înregistrare</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-gold">
            <ScrollText className="h-5 w-5 text-[oklch(0.22_0.08_260)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Regulament</h1>
            <p className="mt-1 text-sm text-white/70">Regulile totalizatorului World Cup 2026.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-8 [&_.app-card]:border-white/10 [&_.app-card]:bg-white/5 [&_h2]:text-white [&_li]:text-white/75 [&_p]:text-white/70">
          <RegulamentContent />
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          <Link to="/" className="underline-offset-4 hover:text-white hover:underline">
            ← Înapoi la pagina principală
          </Link>
        </p>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        ORBICO MOLDOVA · Just for fun · Niciun ban implicat
      </footer>
    </div>
  );
}
