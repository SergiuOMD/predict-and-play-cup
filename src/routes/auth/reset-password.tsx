import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Parolă nouă · OMD WC2026" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setInvalidLink(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setReady(true);
        return;
      }
      const hash = window.location.hash;
      if (!hash.includes("type=recovery") && !new URLSearchParams(window.location.search).has("code")) {
        setInvalidLink(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));

    if (password.length < 6) return toast.error("Parola trebuie să aibă cel puțin 6 caractere.");
    if (password !== confirm) return toast.error("Parolele nu coincid.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return toast.error(error.message);

    toast.success("Parola a fost actualizată!");
    navigate({ to: "/matches" });
  };

  if (invalidLink && !ready) {
    return (
      <AuthShell
        title="Link invalid sau expirat"
        description="Solicită un link nou de resetare a parolei."
        backTo={{ to: "/auth", search: { tab: "login" } }}
      >
        <Button asChild className="w-full">
          <Link to="/auth/forgot-password">Solicită link nou</Link>
        </Button>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell title="Parolă nouă" description="Se verifică linkul de resetare…">
        <p className="text-center text-sm text-muted-foreground">Un moment…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Parolă nouă"
      description="Alege o parolă nouă pentru contul tău."
      backTo={{ to: "/auth", search: { tab: "login" } }}
    >
      <form method="post" onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
        <div>
          <Label htmlFor="reset-password">Parolă nouă</Label>
          <Input id="reset-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
        </div>
        <div>
          <Label htmlFor="reset-confirm">Confirmă parola</Label>
          <Input id="reset-confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Salvează parola
        </Button>
      </form>
    </AuthShell>
  );
}
