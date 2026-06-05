import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  next: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  ssr: false,
  head: () => ({ meta: [{ title: "Autentificare · OMD WC2026" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [status, setStatus] = useState("Se finalizează autentificarea cu Google...");

  useEffect(() => {
    const finish = async () => {
      if (search.error) {
        const msg = search.error_description ?? search.error;
        toast.error(msg);
        navigate({ to: "/auth" });
        return;
      }

      const next = search.next?.startsWith("/") ? search.next : "/dashboard";
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        setStatus("Se confirmă sesiunea...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message);
          navigate({ to: "/auth" });
          return;
        }
        navigate({ to: next });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: next });
        return;
      }

      setStatus("Autentificarea a eșuat.");
      toast.error("Nu s-a putut finaliza autentificarea cu Google.");
      navigate({ to: "/auth" });
    };

    finish();
  }, [navigate, search.error, search.error_description, search.next]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p>{status}</p>
      </div>
    </div>
  );
}
