import { Link } from "@tanstack/react-router";
import { Trophy, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import heroImg from "@/assets/wc2026-hero.jpg";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  backTo?: { to: "/auth"; search?: { tab: "login" } };
};

export function AuthShell({ title, description, children, backTo }: AuthShellProps) {
  return (
    <div className="flex h-dvh w-full max-w-none overflow-hidden">
      <aside className="relative hidden h-full w-1/2 shrink-0 overflow-hidden bg-[oklch(0.16_0.05_260)] md:flex md:flex-col">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.16_0.05_260)] via-[oklch(0.16_0.05_260)]/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gradient-gold)]">
              <Trophy className="h-5 w-5 text-[oklch(0.22_0.08_260)]" />
            </div>
            <span className="text-sm leading-tight">ORBICO MOLDOVA WORLD CUP 2026</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3 w-3 text-[var(--accent-gold)]" /> USA · Canada · Mexico
            </div>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Joacă <span className="text-gradient-gold">World Cup 2026</span> alături de colegi
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              48 echipe. 104 meciuri. Un singur clasament — al biroului tău.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex h-full w-full flex-1 items-center justify-center overflow-y-auto bg-background p-6 md:w-1/2 md:flex-none">
        <Card className="w-full max-w-md border-border/60 shadow-[var(--shadow-elegant)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)] md:hidden">
              <Trophy className="h-6 w-6 text-[oklch(0.22_0.08_260)]" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
            {backTo && (
              <p className="text-center text-sm text-muted-foreground">
                <Link to={backTo.to} search={backTo.search} className="text-primary underline-offset-4 hover:underline">
                  Înapoi la login
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
