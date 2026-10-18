import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Support — Lift", description: "Get help with Lift." };

export default function SupportPage() {
  return (
    <LegalPage title="Help & support" updated="October 18, 2026">
      <p>Questions, bugs or ideas? The round button at the bottom of every screen sends them straight to us.</p>
      <Contact />

      <h2>Common questions</h2>
      <p>
        <strong className="font-medium">Put Lift on my home screen:</strong> in Safari, tap Share, then Add to Home
        Screen. On Android, use Install app in the Chrome menu.
      </p>
      <p>
        <strong className="font-medium">Forgot my password:</strong> if you sign in with Google there&apos;s nothing to
        reset. Otherwise tap &quot;Forgot password?&quot; on the sign-in screen. If no email arrives, message the
        person who invited you.
      </p>
      <p>
        <strong className="font-medium">Change my plan:</strong> open a workout and tap Edit to rename, reorder, add or
        delete exercises and change sets × reps. To start fresh, Settings → Build a new plan.
      </p>
      <p>
        <strong className="font-medium">What&apos;s a superset?</strong> Two exercises done back to back with no rest in
        between. They&apos;re grouped with a line on the left.
      </p>
      <p>
        <strong className="font-medium">Export my data:</strong> Settings → Export my data downloads every logged set
        as a spreadsheet file.
      </p>
      <p>
        <strong className="font-medium">Delete my account:</strong> Settings → Delete account. This erases your
        workouts and history permanently.
      </p>
    </LegalPage>
  );
}
