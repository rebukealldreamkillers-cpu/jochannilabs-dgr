import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-none">
              Jochanni Labs
            </p>
            <p className="text-sm font-semibold leading-tight mt-0.5">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Sponsor</span>
          <UserButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
