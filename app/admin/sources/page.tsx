import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_SOURCES } from "@/lib/data/demo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sources" };

export default async function AdminSourcesPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const supabase = await createServerSupabase();
  let sources = DEMO_SOURCES;
  if (supabase) {
    const { data } = await supabase.from("job_sources").select("*").order("name");
    if (data?.length) sources = data as typeof DEMO_SOURCES;
  }
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Job sources</h1>
      <p className="text-body-sm text-on-surface-variant">
        There is no universal government jobs API. Each source is an official website. If automated parse fails, status stays manual and admins verify listings.
      </p>
      <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-t border-outline-variant">
                <td className="p-3">{source.name}</td>
                <td className="p-3">
                  <a href={source.source_url} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    {source.source_url}
                  </a>
                </td>
                <td className="p-3">{source.source_type}</td>
                <td className="p-3">{source.status}</td>
                <td className="p-3">{source.last_checked_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
