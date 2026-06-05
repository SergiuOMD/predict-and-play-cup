import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

const searchSchema = z.object({ tab: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Login · OMD WC2026" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/matches" });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/matches",
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
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
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const display_name = String(fd.get("name"));
    const invite_code = String(fd.get("invite"));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name, invite_code }, emailRedirectTo: window.location.origin + "/matches" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cont creat! Te poți autentifica.");
    navigate({ to: "/matches" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>OMD World Cup 2026</CardTitle>
          <CardDescription>Autentifică-te ca să trimiți pronosticuri</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={tab ?? "login"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Înregistrare</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Parolă</Label><Input name="password" type="password" required /></div>
                <Button type="submit" className="w-full" disabled={loading}>Login</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div><Label>Nume afișat</Label><Input name="name" required /></div>
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Parolă</Label><Input name="password" type="password" required minLength={6} /></div>
                <div><Label>Cod invitație</Label><Input name="invite" required placeholder="OMDworldcup2026" /></div>
                <Button type="submit" className="w-full" disabled={loading}>Creează cont</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> sau <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continuă cu Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
