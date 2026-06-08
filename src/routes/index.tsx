import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Users, Sparkles, Zap, Calendar } from "lucide-react";
import heroImg from "@/assets/wc2026-hero.jpg";
import trophyImg from "@/assets/wc2026-trophy.png";

const BRAND = "ORBICO MOLDOVA";
const BRAND_FULL = "ORBICO MOLDOVA WORLD CUP 2026";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND_FULL} Totalizator` },
      { name: "description", content: "Pronostichează scorurile la FIFA World Cup 2026 alături de colegii tăi." },
      { property: "og:title", content: `${BRAND_FULL} Totalizator` },
      { property: "og:description", content: "Pronostichează scorurile la FIFA World Cup 2026 alături de colegii tăi." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen-safe overflow-x-hidden bg-[oklch(0.16_0.05_260)] text-white">
      <header className="relative z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex min-w-0 items-center gap-2 font-bold">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-gold shadow-[var(--shadow-gold)]">
              <Trophy className="h-5 w-5 text-[oklch(0.22_0.08_260)]" />
            </div>
            <span className="truncate text-sm tracking-tight sm:text-base">{BRAND_FULL}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link to="/regulament">Regulament</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-gradient-gold font-semibold shadow-[var(--shadow-gold)]">
              <Link to="/auth" search={{ tab: "signup" }}>Înregistrează-te</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.16_0.05_260)]/70 via-[oklch(0.16_0.05_260)]/40 to-[oklch(0.16_0.05_260)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 text-center md:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-widest backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
            <span>FIFA World Cup 2026 · USA · Canada · Mexico</span>
          </div>
          <h1 className="mt-8 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">
            Pune-ți instinctul <br />
            <span className="text-gradient-gold">la pariu</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/70 md:text-lg">
            Totalizatorul {BRAND} pentru World Cup 2026. Pronostichează 3 scoruri per meci,
            urmărește clasamentul live și demonstrează că tu ești expertul biroului.
          </p>
          <div className="relative z-20 mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-gold font-semibold shadow-[var(--shadow-gold)]">
              <Link to="/auth" search={{ tab: "signup" }}>
                <Zap className="mr-2 h-4 w-4" /> Începe acum
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/matches">Vezi meciurile</Link>
            </Button>
          </div>

          <div className="relative z-0 mt-16 flex justify-center md:mt-20">
            <img
              src={trophyImg}
              alt="Trophy"
              className="pointer-events-none h-44 drop-shadow-[0_20px_50px_oklch(0.78_0.16_80/0.4)] sm:h-52 md:h-60 lg:h-72"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { v: "48", l: "Echipe" },
            { v: "104", l: "Meciuri" },
            { v: "16", l: "Orașe gazdă" },
            { v: "1", l: "Trofeu" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-black text-[var(--accent-gold)] md:text-4xl">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "3 pronosticuri / meci", desc: "Trimite trei scoruri (identice sau diferite). 1 punct pentru fiecare exact." },
            { icon: Trophy, title: "Bonus campion & golgheter", desc: "+5 puncte pentru fiecare predicție bonus corectă la final de turneu." },
            { icon: Users, title: "Clasament live", desc: "Realtime — vezi cum stai față de colegi după fluierul de final." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-[var(--accent-gold)]/40 hover:bg-white/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold">
                <Icon className="h-6 w-6 text-[oklch(0.22_0.08_260)]" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-white/70">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur transition-all hover:border-[var(--accent-gold)]/30 md:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold">
            <Calendar className="h-7 w-7 text-[oklch(0.22_0.08_260)]" />
          </div>
          <h2 className="mt-6 text-3xl font-black md:text-4xl">Gata să joci?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Ai nevoie doar de un cod de invitație. Înregistrarea durează 30 de secunde.
          </p>
          <Button asChild size="lg" className="mt-8 bg-gradient-gold px-10 font-semibold shadow-[var(--shadow-gold)]">
            <Link to="/auth" search={{ tab: "signup" }}>Creează cont</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        <p>{BRAND} · Just for fun · Niciun ban implicat</p>
        <p className="mt-2">
          <Link to="/regulament" className="text-white/60 underline-offset-4 hover:text-white hover:underline">
            Regulament
          </Link>
        </p>
      </footer>
    </div>
  );
}
