import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { AmbientBackground } from "@/components/fx/ambient-background";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  // The reset-email link lands here already signed in (the auth callback
  // exchanged the recovery code for a session).
  const user = await getUser();
  if (!user) redirect("/forgot-password");

  return (
    <div className="relative isolate mx-auto flex max-w-sm flex-col items-center gap-6 px-4 py-16">
      <AmbientBackground variant="aurora" />
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Crown className="size-6 text-gold" /> TCG Emperor
      </Link>
      <div className="w-full rounded-xl border bg-card/80 p-6 shadow-lift backdrop-blur">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">
            for {user.email}
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
