"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch {
          // ignore when supabase is not configured
        }
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
