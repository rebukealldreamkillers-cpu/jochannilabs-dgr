"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted w-full"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
