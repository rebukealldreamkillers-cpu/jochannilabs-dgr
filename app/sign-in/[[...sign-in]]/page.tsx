import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Jochanni Labs</p>
          <h1 className="text-2xl font-semibold mt-1">Decision Governance Review</h1>
          <p className="text-sm text-muted-foreground mt-2">Analyst sign in</p>
        </div>
        <SignIn afterSignInUrl="/admin/engagements" afterSignUpUrl="/admin/engagements" />
      </div>
    </div>
  );
}
