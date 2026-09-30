import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  ClipboardList,
  Landmark,
  TrainFront,
  IndianRupee,
  Shield,
  Siren,
  Factory,
  Building2,
  Terminal,
  BookOpen,
  BadgeCheck,
  Award,
  Link2,
  Scale,
  Gavel,
  RefreshCw,
} from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { buttonVariants } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants";
import { homepageSections } from "@/lib/jobs/queries";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { checkEligibility } from "@/lib/eligibility/engine";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/jobs";

export const dynamic = "force-dynamic";

const ICONS = {
  ClipboardList,
  Landmark,
  TrainFront,
  IndianRupee,
  Shield,
  Siren,
  Factory,
  Building2,
  Terminal,
  BookOpen,
  BadgeCheck,
  Award,
} as const;

export default async function HomePage() {
  const sections = await homepageSections();
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;

  function withEligibility(jobs: Job[]) {
    if (!profile) return jobs.map((job) => ({ job, eligibility: null }));
    return jobs.map((job) => ({ job, eligibility: checkEligibility(profile, job) }));
  }

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden pb-space-xl">
        <div className="pointer-events-none absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl" />
        <div className="grid grid-cols-1 items-center gap-gutter xl:grid-cols-12">
          <div className="flex flex-col gap-space-lg xl:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-label-sm font-semibold tracking-wide text-secondary uppercase">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Official-source listings · demo data clearly labelled
            </div>
            <h1 className="font-display text-display-lg tracking-tight text-primary">
              Find Government Jobs You&apos;re{" "}
              <span className="text-secondary underline decoration-secondary-container decoration-4 underline-offset-4">
                Actually Eligible For
              </span>
            </h1>
            <p className="max-w-2xl text-body-lg text-on-surface-variant">
              Search Central and State Government jobs by qualification, age, state, category, branch, and
              experience. Get an automated eligibility indication and apply through official recruitment websites.
            </p>
            <HomeSearch />
            <div className="flex flex-wrap items-center gap-space-md">
              <Link
                href="/eligibility"
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-space-lg py-space-sm text-label-lg text-primary shadow-md"
              >
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary" />
                </span>
                Check My Eligibility
                <Bolt className="h-4 w-4 text-secondary" />
              </Link>
              <p className="text-body-sm text-on-surface-variant">No login required to run a basic match.</p>
            </div>
          </div>
          <aside className="xl:col-span-5">
            <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-headline-sm font-bold text-on-surface">
                    {profile?.full_name || "Guest candidate"}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {profile
                      ? `${profile.highest_qualification || "Add qualification"} · ${profile.state || "Add state"}`
                      : "Complete the matcher to personalise results"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-headline-lg font-bold text-primary">{sections.total}</p>
                  <p className="text-label-sm tracking-wider text-on-surface-variant uppercase">Published jobs</p>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Counts come from the database (or bundled demo dataset if Supabase is not configured). Sample jobs
                are labelled Demo Data.
              </p>
              <Link href="/eligibility" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
                Tune profile variables
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="my-space-xl rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-col items-center justify-between gap-space-lg lg:flex-row">
          <div>
            <p className="font-headline-xl font-extrabold text-primary">{sections.total} published listings</p>
            <p className="text-body-sm text-on-surface-variant">
              Tracked from configured official sources. Unverified fetches stay in the admin queue.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-space-md sm:grid-cols-4 lg:w-auto">
            <Trust icon={Link2} title="Official links" sub="Direct .gov.in / org sites" />
            <Trust icon={Scale} title="Rule engine" sub="Structured criteria" />
            <Trust icon={Gavel} title="No fake APIs" sub="No invented vacancies" />
            <Trust icon={RefreshCw} title="Collector" sub="GitHub Actions daily" />
          </div>
        </div>
      </section>

      <section className="my-space-xl">
        <SectionHeading title="Popular Categories" href="/jobs" />
        <div className="grid grid-cols-2 gap-gutter md:grid-cols-4">
          {JOB_CATEGORIES.map((category) => {
            const Icon = ICONS[category.icon as keyof typeof ICONS] ?? ClipboardList;
            const count = sections.counts[category.value] ?? 0;
            const href =
              category.value === "10th" || category.value === "12th"
                ? `/jobs?qualification=${category.value}`
                : `/jobs?category=${category.value}`;
            return (
              <Link
                key={category.value}
                href={href}
                className="flex h-36 flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm hover:bg-surface-container-low"
              >
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-headline-sm font-bold text-on-surface">{category.label}</h3>
                  <p className="text-body-sm font-semibold text-secondary">{count} listings</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <JobRow title="Latest Government Jobs" jobs={withEligibility(sections.latest)} />
      <JobRow title="Closing Soon" jobs={withEligibility(sections.closingSoon)} />
      <JobRow title="B.Tech Jobs" jobs={withEligibility(sections.btech)} href="/jobs?qualification=btech" />
      <JobRow title="12th Pass Jobs" jobs={withEligibility(sections.twelfth)} href="/jobs?qualification=12th" />
      <JobRow title="Technical/IT Jobs" jobs={withEligibility(sections.technical)} href="/jobs?category=technical" />
    </div>
  );
}

function HomeSearch() {
  return (
    <form action="/jobs" className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xl">
      <div className="grid grid-cols-1 gap-space-sm md:grid-cols-12">
        <input
          name="q"
          placeholder="Search jobs, exams, departments, or qualifications"
          className="h-11 rounded-lg bg-surface-container-low px-4 text-body-md md:col-span-6"
        />
        <select name="state" className="h-11 rounded-lg bg-surface-container-low px-3 text-body-sm md:col-span-3">
          <option value="">All India</option>
          <option value="Bihar">Bihar</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Delhi">Delhi</option>
          <option value="Maharashtra">Maharashtra</option>
        </select>
        <select name="qualification" className="h-11 rounded-lg bg-surface-container-low px-3 text-body-sm md:col-span-3">
          <option value="">Any qualification</option>
          <option value="btech">B.Tech / B.E.</option>
          <option value="graduate">Graduate</option>
          <option value="12th">12th</option>
          <option value="10th">10th</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button type="submit" className={cn(buttonVariants(), "h-11 px-space-lg")}>
          Search Jobs <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function Trust({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Link2;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-space-sm">
      <Icon className="h-5 w-5 text-secondary" />
      <div>
        <p className="text-label-md font-bold">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-space-lg flex items-end justify-between">
      <h2 className="font-headline-xl font-bold text-primary">{title}</h2>
      {href ? (
        <Link href={href} className="text-label-lg font-semibold text-primary">
          View all
        </Link>
      ) : null}
    </div>
  );
}

function JobRow({
  title,
  jobs,
  href,
}: {
  title: string;
  href?: string;
  jobs: { job: Job; eligibility: ReturnType<typeof checkEligibility> | null }[];
}) {
  return (
    <section className="my-space-xl">
      <SectionHeading title={title} href={href} />
      {jobs.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No listings in this section yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          {jobs.map(({ job, eligibility }) => (
            <JobCard key={job.id} job={job} eligibility={eligibility} />
          ))}
        </div>
      )}
    </section>
  );
}
