import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  SENSITIVE_SEARCH_KEYS,
  stripSensitiveFromSearchRecord,
  stripSensitiveSearchParams,
} from "@/lib/sanitize-search-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy, Sparkles } from "lucide-react";
import heroImg from "@/assets/wc2026-hero.jpg";

const searchSchema = z.object({ tab: z.enum(["login", "signup"]).optional() });

function validateAuthSearch(search: Record<string, unknown>) {
  return searchSchema.parse(stripSensitiveFromSearchRecord(search));
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: validateAuthSearch,
  beforeLoad: ({ location }) => {
    const params = new URLSearchParams(location.search);
    let dirty = false;
    for (const key of [...params.keys()]) {
      if (SENSITIVE_SEARCH_KEYS.has(key.toLowerCase())) {
        params.delete(key);
        dirty = true;
      }
    }
    if (dirty) {
      const tab = params.get("tab");
      throw redirect({
        to: "/auth",
        search: tab === "signup" ? { tab: "signup" } : undefined,
        replace: true,
      });
    }
  },
  head: () => ({ meta: [{ title: "Login · OMD WC2026" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stripSensitiveSearchParams()) {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      navigate({
        to: "/auth",
        search: tabParam === "signup" ? { tab: "signup" } : undefined,
        replace: true,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/matches" });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bine ai revenit!");
    navigate({ to: "/matches" });
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    const display_name = String(fd.get("name")).trim();
    const invite_code = String(fd.get("invite")).trim();

    if (!invite_code) {
      setLoading(false);
      return toast.error("Codul de invitație este obligatoriu.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name, invite_code },
      },
    });
    setLoading(false);
    if (error) {
      const hint =
        error.message.includes("Database error") || error.status === 500
          ? `${error.message} — Rulează migrarea 20260605170000_email_only_signup.sql pe Supabase.`
          : error.message;
      return toast.error(hint);
    }
    if (data.session) {
      toast.success("Cont creat!");
      navigate({ to: "/matches" });
      return;
    }
    toast.success("Cont creat! Te poți autentifica acum.");
    navigate({ to: "/auth", search: { tab: "login" } });
  };

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
            <CardTitle className="text-2xl">Bun venit la totalizator</CardTitle>
            <CardDescription>
              Autentificare doar cu email și parolă. La înregistrare ai nevoie de cod de invitație.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={tab ?? "login"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Înregistrare</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form method="post" action="/auth" onSubmit={handleLogin} className="space-y-3" autoComplete="on">
                  <div><Label htmlFor="login-email">Email</Label><Input id="login-email" name="email" type="email" required autoComplete="email" /></div>
                  <div><Label htmlFor="login-password">Parolă</Label><Input id="login-password" name="password" type="password" required autoComplete="current-password" /></div>
                  <Button type="submit" className="w-full" disabled={loading}>Login</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form method="post" action="/auth" onSubmit={handleSignup} className="space-y-3" autoComplete="on">
                  <div><Label htmlFor="signup-name">Nume afișat</Label><Input id="signup-name" name="name" required autoComplete="name" /></div>
                  <div><Label htmlFor="signup-email">Email</Label><Input id="signup-email" name="email" type="email" required autoComplete="email" /></div>
                  <div><Label htmlFor="signup-password">Parolă</Label><Input id="signup-password" name="password" type="password" required minLength={6} autoComplete="new-password" /></div>
                  <div>
                    <Label htmlFor="signup-invite">Cod invitație</Label>
                    <Input id="signup-invite" name="invite" required placeholder="Introdu codul primit" autoComplete="off" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>Creează cont</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
