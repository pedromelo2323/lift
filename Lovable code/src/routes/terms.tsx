import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, SUPPORT_EMAIL, head } from "@/components/lift/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => head("Terms of Use", "The simple terms for using Lift."),
  component: () => (
    <LegalPage title="Terms of Use" updated="September 29, 2026">
      <p>By using Lift you agree to these terms.</p>
      <h2>Your account</h2>
      <p>Keep your sign-in details safe. You're responsible for activity on your account. You can delete it anytime in Settings.</p>
      <h2>Not medical advice</h2>
      <p>Lift helps you remember what you lifted. It isn't medical or coaching advice. Train within your limits and consult a professional when unsure.</p>
      <h2>Fair use</h2>
      <p>Don't misuse the app or try to access other people's data. We may suspend accounts that do.</p>
      <h2>The service</h2>
      <p>Lift is provided as is. We work to keep it reliable but can't guarantee it will always be available or error-free.</p>
      <h2>Changes</h2>
      <p>We may update these terms and will change the date above when we do.</p>
      <h2>Contact</h2>
      <p><a className="underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </LegalPage>
  ),
});
