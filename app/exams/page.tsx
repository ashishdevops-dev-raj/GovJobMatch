import Link from "next/link";
import { getExams } from "@/lib/jobs/queries";
import { EXAM_FAMILIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exams",
  description: "Explore major Indian government exam families. Sample data until live exam rows are added.",
};

export default async function ExamsPage() {
  const exams = await getExams();
  return (
    <div className="space-y-6">
      <h1 className="font-headline-xl font-bold text-primary">Exam explorer</h1>
      <p className="text-body-md text-on-surface-variant">
        Categories are designed so real exam calendars can be added later. Current rows are database/sample records with official source links.
      </p>
      {EXAM_FAMILIES.map((family) => {
        const items = exams.filter((exam) => exam.family === family);
        if (!items.length) return null;
        return (
          <section key={family}>
            <h2 className="mb-3 font-headline-lg text-primary">{family}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((exam) => (
                <article key={exam.id} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-headline-sm font-bold">{exam.name}</h3>
                    {exam.is_sample ? (
                      <span className="rounded-full bg-tertiary-fixed px-2 text-label-sm">Demo Data</span>
                    ) : null}
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{exam.description}</p>
                  <p className="mt-2 text-label-md">Typical qualification: {exam.typical_qualification}</p>
                  <a
                    href={exam.official_url}
                    className="mt-2 inline-block text-label-md text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official website
                  </a>
                  <div>
                    <Link href={`/jobs?q=${encodeURIComponent(exam.family)}`} className="text-label-sm text-on-surface-variant">
                      Related jobs
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
