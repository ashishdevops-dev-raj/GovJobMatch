import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_JOBS } from "@/lib/data/demo";
import { AdminJobsTable } from "./table";
import { CreateJobForm } from "./create-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin jobs" };

export default async function AdminJobsPage() {
  const user = await getSessionUser();
  if (!user || !(await isAdminUser(user.id))) redirect("/");
  const supabase = await createServerSupabase();
  let jobs = DEMO_JOBS;
  if (supabase) {
    const { data } = await supabase
      .from("jobs")
      .select("*, organizations(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) jobs = data as typeof DEMO_JOBS;
  }
  return (
    <div className="space-y-4">
      <h1 className="font-headline-xl font-bold text-primary">Job management</h1>
      <p className="text-body-sm text-on-surface-variant">
        Fetched jobs start as pending / unverified. Publish only after checking the official notification URL.
      </p>
      <CreateJobForm />
      <AdminJobsTable jobs={jobs} />
    </div>
  );
}
