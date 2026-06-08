import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Resetare parolă · OMD WC2026" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email")).trim();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    if (error) return toast.error(error.message);

    setSent(true);
    toast.success("Link de resetare trimis!");
  };

  if (sent) {
    return (
      <AuthShell
        title="Verifică emailul"
        description="Dacă există un cont cu adresa introdusă, vei primi un link pentru resetarea parolei."
        backTo={{ to: "/auth", search: { tab: "login" } }}
      >
        <Button type="button" className="w-full" onClick={() => navigate({ to: "/auth", search: { tab: "login" } })}>
          Înapoi la login
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Am uitat parola"
      description="Introdu emailul contului tău. Îți trimitem un link pentru a seta o parolă nouă."
      backTo={{ to: "/auth", search: { tab: "login" } }}
    >
      <form method="post" onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
        <div>
          <Label htmlFor="forgot-email">Email</Label>
          <Input id="forgot-email" name="email" type="email" required autoComplete="email" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Trimite link de resetare
        </Button>
      </form>
    </AuthShell>
  );
}
