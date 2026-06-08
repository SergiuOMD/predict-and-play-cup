import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  SENSITIVE_SEARCH_KEYS,
  stripSensitiveFromSearchRecord,
  stripSensitiveSearchParams,
} from "@/lib/sanitize-search-params";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({ tab: z.enum(["login", "signup"]).optional() });

function validateAuthSearch(search: Record<string, unknown>) {
  return searchSchema.parse(stripSensitiveFromSearchRecord(search));
}

export const Route = createFileRoute("/auth/")({
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
    <AuthShell
      title="Bun venit la totalizator"
      description="Autentificare doar cu email și parolă. La înregistrare ai nevoie de cod de invitație."
    >
      <Tabs defaultValue={tab ?? "login"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Înregistrare</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-3">
          <form method="post" onSubmit={handleLogin} className="space-y-3" autoComplete="on">
            <div><Label htmlFor="login-email">Email</Label><Input id="login-email" name="email" type="email" required autoComplete="email" /></div>
            <div><Label htmlFor="login-password">Parolă</Label><Input id="login-password" name="password" type="password" required autoComplete="current-password" /></div>
            <Button type="submit" className="w-full" disabled={loading}>Login</Button>
          </form>
          <p className="text-right">
            <Link to="/auth/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
              Am uitat parola
            </Link>
          </p>
        </TabsContent>

        <TabsContent value="signup">
          <form method="post" onSubmit={handleSignup} className="space-y-3" autoComplete="on">
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
      <p className="pt-2 text-center text-sm text-muted-foreground">
        <Link to="/regulament" className="text-primary underline-offset-4 hover:underline">
          Regulament
        </Link>
      </p>
    </AuthShell>
  );
}
