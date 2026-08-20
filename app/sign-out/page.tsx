"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/sign-in" });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you out…</p>
    </div>
  );
}
