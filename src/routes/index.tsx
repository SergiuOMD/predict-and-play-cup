import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Users, Sparkles, Zap, Calendar } from "lucide-react";
import heroImg from "@/assets/wc2026-hero.jpg";
import trophyImg from "@/assets/wc2026-trophy.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OMD World Cup 2026 Totalizator" },
      { name: "description", content: "Pronostichează scorurile la FIFA World Cup 2026 alături de colegii tăi." },
      { property: "og:title", content: "OMD World Cup 2026 Totalizator" },
      { property: "og:description", content: "Pronostichează scorurile la FIFA World Cup 2026 alături de colegii tăi." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[oklch(0.16_0.05_260)] text-white">
      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)]">
              <Trophy className="h-5 w-5 text-[oklch(0.22_0.08_260)]" />
            </div>
            <span className="tracking-tight">OMD · WC2026</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-[var(--gradient-gold)] text-[oklch(0.22_0.08_260)] hover:opacity-90">
              <Link to="/auth" search={{ tab: "signup" }}>Înregistrează-te</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.16_0.05_260)]/70 via-[oklch(0.16_0.05_260)]/40 to-[oklch(0.16_0.05_260)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-20 text-center md:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-widest backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
            <span>FIFA World Cup 2026 · USA · Canada · Mexico</span>
          </div>
          <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Pune-ți instinctul <br />
            <span className="text-gradient-gold">la pariu</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/70 md:text-lg">
            Totalizatorul OMD pentru World Cup 2026. Pronostichează 3 scoruri per meci,
            urmărește clasamentul live și demonstrează că tu ești expertul biroului.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-[var(--gradient-gold)] text-[oklch(0.22_0.08_260)] shadow-[var(--shadow-gold)] hover:opacity-90">
              <Link to="/auth" search={{ tab: "signup" }}>
                <Zap className="mr-2 h-4 w-4" /> Începe acum
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/matches">Vezi meciurile</Link>
            </Button>
          </div>
        </div>

        {/* Floating trophy */}
        <img
          src={trophyImg}
          alt="Trophy"
          className="pointer-events-none absolute -bottom-10 left-1/2 hidden h-64 -translate-x-1/2 drop-shadow-[0_20px_50px_oklch(0.78_0.16_80/0.4)] lg:block"
        />
      </section>

      {/* Stats strip */}
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

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "3 pronosticuri / meci", desc: "Trimite trei scoruri (identice sau diferite). 1 punct pentru fiecare exact." },
            { icon: Trophy, title: "Bonus campion & golgheter", desc: "+5 puncte pentru fiecare predicție bonus corectă la final de turneu." },
            { icon: Users, title: "Clasament live", desc: "Realtime — vezi cum stai față de colegi după fluierul de final." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-[var(--accent-gold)]/40 hover:bg-white/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gradient-gold)] text-[oklch(0.22_0.08_260)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-white/70">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[oklch(0.45_0.18_265)] to-[oklch(0.3_0.14_270)] p-10 text-center shadow-[var(--shadow-elegant)] md:p-16">
          <Calendar className="mx-auto h-10 w-10 text-[var(--accent-gold)]" />
          <h2 className="mt-4 text-3xl font-black md:text-4xl">Gata să joci?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Ai nevoie doar de un cod de invitație. Înregistrarea durează 30 de secunde.
          </p>
          <Button asChild size="lg" className="mt-6 bg-[var(--gradient-gold)] text-[oklch(0.22_0.08_260)] shadow-[var(--shadow-gold)] hover:opacity-90">
            <Link to="/auth" search={{ tab: "signup" }}>Creează cont</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        OMD · Just for fun · Niciun ban implicat
      </footer>
    </div>
  );
}
