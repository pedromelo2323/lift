import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = {
  title: "Build your plan — Lift",
  description: "Tell Lift how you train and get a plan built for you in seconds.",
};

export default function OnboardingPage() {
  return <Onboarding />;
}
