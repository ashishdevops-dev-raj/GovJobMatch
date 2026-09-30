import Link from "next/link";
import { redirect } from "next/navigation";
import { adminStats } from "@/lib/jobs/queries";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

const LINKS = [
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/notifications", label: "Notifications" },
];

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const stats = await adminStats();
  return (
    <div className="space-y-6">
      <h1 className="font-headline-xl font-bold text-primary">Admin dashboard</h1>
      {stats.usingDemo ? (
        <p className="rounded-lg bg-tertiary-fixed p-3 text-body-sm">
          Showing local demo counts because Supabase is not configured.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Total Jobs" value={stats.totalJobs} />
        <Stat label="Verified Jobs" value={stats.verifiedJobs} />
        <Stat label="Pending Jobs" value={stats.pendingJobs} />
        <Stat label="Closing Soon" value={stats.closingSoon} />
        <Stat label="Users" value={stats.users} />
        <Stat label="Saved Jobs" value={stats.savedJobs} />
      </div>
      <div className="flex flex-wrap gap-3">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg bg-primary px-4 py-2 text-on-primary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-lg font-bold text-primary">{value}</p>
    </div>
  );
}
