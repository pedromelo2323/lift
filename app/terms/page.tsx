import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use — Lift",
  description: "The simple terms for using Lift.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="October 17, 2026">
      <p>By using Lift you agree to these terms.</p>

      <h2>Your account</h2>
      <p>
        Keep your sign-in details safe. You&apos;re responsible for activity on your account. You
        can ask for it to be deleted at any time.
      </p>

      <h2>Not medical advice</h2>
      <p>
        Lift helps you remember what you lifted. It isn&apos;t medical or coaching advice. Train
        within your limits and consult a professional when unsure.
      </p>

      <h2>Fair use</h2>
      <p>Don&apos;t misuse the app or try to access other people&apos;s data. Accounts that do may be suspended.</p>

      <h2>The service</h2>
      <p>
        Lift is a free, non-commercial project provided as is. It may change, be unavailable, or
        shut down, and there&apos;s no guarantee it will be error-free.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated; the date above will change when they are.</p>

      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  );
}
