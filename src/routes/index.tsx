import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OMD World Cup 2026 Totalizator" },
      { name: "description", content: "Pronostichează scorurile la FIFA World Cup 2026 alături de colegii tăi." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-bold">
            <Trophy className="h-6 w-6 text-primary" />
            <span>OMD World Cup 2026</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Login</Link></Button>
            <Button asChild><Link to="/auth" search={{ tab: "signup" }}>Înregistrează-te</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>FIFA World Cup 2026 · Just for fun</span>
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Totalizatorul OMD <br /> pentru World Cup 2026
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pronostichează 3 scoruri la fiecare meci. 1 punct pentru fiecare scor exact.
            Vezi clasamentele live alături de colegii tăi.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ tab: "signup" }}>Începe acum</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/matches">Vezi meciurile</Link></Button>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "3 pronosticuri / meci", desc: "Trimite trei scoruri diferite (sau identice) pentru fiecare meci." },
            { icon: Trophy, title: "Bonus campion & golgheter", desc: "+5 puncte pentru fiecare predicție bonus corectă." },
            { icon: Users, title: "Clasamente live", desc: "Real-time. Vezi cum stai față de colegi după fiecare meci." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
