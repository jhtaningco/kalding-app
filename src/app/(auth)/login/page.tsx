import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign In | Kalding English",
  description: "Sign in to Kalding English to continue your typing practice.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <AuthForm initialMode="login" />
    </main>
  );
}
