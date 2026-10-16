import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, SUPPORT_EMAIL, head } from "@/components/lift/legal-page";

export const Route = createFileRoute("/support")({
  head: () => head("Support", "Get help with Lift."),
  component: () => (
    <LegalPage title="Support">
      <p>Questions, bugs or ideas? Write to us and we'll get back to you.</p>
      <p><a className="text-[17px] underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      <h2>Common questions</h2>
      <p><strong className="font-medium">Reset my password:</strong> tap "Forgot password?" on the sign-in screen.</p>
      <p><strong className="font-medium">Export my data:</strong> Settings → Export my data.</p>
      <p><strong className="font-medium">Delete my account:</strong> Settings → Delete account. This erases everything permanently.</p>
    </LegalPage>
  ),
});
