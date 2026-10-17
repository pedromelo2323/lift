import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Lift",
  description: "What Lift stores, why, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 17, 2026">
      <p>
        Lift is a small, non-commercial workout log shared with friends. It keeps only what&apos;s
        needed to remember your training.
      </p>

      <h2>What we store</h2>
      <p>
        Your email address and name. If you sign in with Google, Google shares your name, email
        address and profile picture; Lift uses only your name and email.
      </p>
      <p>Your workouts, exercises, sets, notes, and any feedback or bug reports you send.</p>
      <p>Unsaved changes to a workout are kept on your device until they sync.</p>

      <h2>How it&apos;s used</h2>
      <p>
        Only to run the app: signing you in, showing your workouts back to you, and fixing problems
        you report. Information from your Google account is used only to sign you in.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>No ads, no analytics, no tracking across other apps or websites. We never sell or share your data.</p>

      <h2>Who can see it</h2>
      <p>
        Your workouts are visible only to your account. The person who runs Lift can read feedback
        and bug reports, along with the name of whoever sent them.
      </p>

      <h2>Where it lives</h2>
      <p>
        Data is stored with Supabase (database and sign-in, hosted in Ireland, EU). The app is
        served by Vercel.
      </p>

      <h2>Deleting your data</h2>
      <p>
        Ask using the contact below and your account and everything in it will be permanently
        deleted.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, the date above will change too.</p>

      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  );
}
