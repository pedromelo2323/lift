import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Lift — remember what you lifted last time",
  description: "A calm workout log for progressive overload.",
};

export default function AuthPage() {
  return <AuthScreen />;
}
