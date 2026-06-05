import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const DEFAULT_POST_AUTH_PATH = "/dashboard";

function getPostAuthUrl() {
  if (typeof window === "undefined") return DEFAULT_POST_AUTH_PATH;
  return `${window.location.origin}${DEFAULT_POST_AUTH_PATH}`;
}

function getOAuthCallbackUrl() {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

/** True when running on Lovable-hosted preview/production URLs. */
function isLovableHosted() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.includes("lovable")
  );
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (isLovableHosted()) {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getPostAuthUrl(),
    });
    return { error: result.error ?? null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthCallbackUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  return { error: error ?? null };
}
