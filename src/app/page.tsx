"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "unauthenticated") {
      // Outside Telegram or auth failed — show nothing meaningful
      return;
    }

    if (auth.user.onboarding_completed) {
      router.replace("/home");
    } else {
      router.replace("/onboarding");
    }
  }, [auth, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
