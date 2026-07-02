import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getUser()) redirect("/account");

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 px-4 py-16">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Crown className="size-6 text-primary" /> TCG Emperor
      </Link>
      <div className="w-full rounded-xl border p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Track orders and check out faster
          </p>
        </div>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
