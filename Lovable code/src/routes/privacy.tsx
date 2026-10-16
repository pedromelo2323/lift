import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, SUPPORT_EMAIL, head } from "@/components/lift/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => head("Privacy Policy", "What Lift stores, why, and how to delete it."),
  component: () => (
    <LegalPage title="Privacy Policy" updated="September 29, 2026">
      <p>Lift is a workout log. We keep only what's needed to remember your sets.</p>
      <h2>What we store</h2>
      <p>Your email and name (or the ones shared by Apple or Google when you sign in), your workouts, exercises, sets, notes and any feedback you send.</p>
      <p>Units and appearance settings stay on your device.</p>
      <p>When you build a plan, we save your answers (age range, sex, goal, days per week, session length, experience). Those answers and anything you type or say about your training go to an AI service to create the plan. Voice recordings are turned into text and not kept.</p>
      <h2>What we don't do</h2>
      <p>No ads, no tracking across other apps or websites, and we never sell or share your data.</p>
      <h2>Where it lives</h2>
      <p>Your data is stored securely with our hosting provider, and only your account can access it.</p>
      <h2>Your control</h2>
      <p>Export all your sets anytime in Settings. Delete your account in Settings and all your data is permanently erased.</p>
      <h2>Contact</h2>
      <p><a className="underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </LegalPage>
  ),
});
