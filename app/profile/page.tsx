import { ProfileForm } from "./profile-form";
import { getProfile, getSessionUser, profileCompletion } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");
  const profile = await getProfile(user.id);
  const completion = profileCompletion(profile);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-surface-container-lowest p-space-lg">
        <h1 className="font-headline-xl font-bold text-primary">Your profile</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Profile completion: <strong>{completion}%</strong>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full bg-secondary" style={{ width: `${completion}%` }} />
        </div>
      </section>
      <ProfileForm email={user.email ?? ""} profile={profile} />
    </div>
  );
}
