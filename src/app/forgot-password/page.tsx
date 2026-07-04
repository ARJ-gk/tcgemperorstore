import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  if (await getUser()) redirect("/account/update-password");

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 px-4 py-16">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Crown className="size-6 text-primary" /> TCG Emperor
      </Link>
      <div className="w-full rounded-xl border p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
