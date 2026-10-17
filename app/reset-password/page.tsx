import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "New password — Lift",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
