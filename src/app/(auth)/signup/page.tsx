import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign Up | Kalding English",
  description:
    "Create your Kalding English account and start learning English by typing.",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <AuthForm initialMode="signup" />
    </main>
  );
}
