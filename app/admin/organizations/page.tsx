import { redirect } from "next/navigation";
import { getOrganizations } from "@/lib/jobs/queries";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin organizations" };

export default async function AdminOrganizationsPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const orgs = await getOrganizations();
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Organizations</h1>
      <ul className="space-y-2">
        {orgs.map((org) => (
          <li key={org.id} className="rounded-xl bg-surface-container-lowest p-space-md">
            <p className="font-semibold">{org.name}</p>
            <a href={org.official_website ?? "#"} className="text-body-sm text-primary underline">
              {org.official_website}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
