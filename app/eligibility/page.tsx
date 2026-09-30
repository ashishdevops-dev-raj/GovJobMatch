import { EligibilityWizard } from "@/components/eligibility/wizard";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { ELIGIBILITY_DISCLAIMER } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eligibility Matcher",
  description: "Match your qualification, age, state and category to published government job criteria.",
};

export default async function EligibilityPage() {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <h1 className="font-headline-xl font-bold text-primary">Government Job Eligibility Matcher</h1>
        <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
          Tell us your qualification, age, state, category, and preferences. We compare them against structured
          criteria stored for each listing and explain why a job appears to match.
        </p>
        <p className="mt-3 text-body-sm text-on-surface-variant">{ELIGIBILITY_DISCLAIMER}</p>
      </section>
      <EligibilityWizard initial={profile ?? undefined} />
    </div>
  );
}
