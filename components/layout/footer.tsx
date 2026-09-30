import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { OFFICIAL_PORTALS, STATUTORY_NOTICE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-space-xl w-full bg-surface-container-lowest pb-20 shadow-[0_-1px_8px_rgba(0,0,0,0.02)] md:pb-0">
      <div className="mx-auto max-w-[1440px] px-margin-sm py-space-xl md:px-margin">
        <div className="mb-space-lg flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-md">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <div>
            <p className="mb-1 text-label-lg font-semibold text-on-surface">Statutory Transparency Notice</p>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">{STATUTORY_NOTICE}</p>
          </div>
        </div>
        <div className="mb-space-xl grid grid-cols-2 gap-gutter md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <h4 className="mb-2 text-label-lg font-bold text-primary">Recruitment Portals</h4>
            <Link href="/jobs?category=ssc" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Staff Selection (SSC)</Link>
            <Link href="/jobs?category=railway" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Indian Railways (RRB)</Link>
            <Link href="/jobs?category=banking" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Public Sector Banks</Link>
            <Link href="/jobs?category=upsc" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">UPSC</Link>
            <Link href="/jobs?category=state-psc" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">State Public Service</Link>
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="mb-2 text-label-lg font-bold text-primary">Popular Qualifications</h4>
            <Link href="/jobs?qualification=10th" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">10th Pass Matric Jobs</Link>
            <Link href="/jobs?qualification=12th" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">12th Intermediate Vacancies</Link>
            <Link href="/jobs?qualification=btech" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">B.Tech / Engineering</Link>
            <Link href="/jobs?qualification=graduate" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Graduate (Any Stream)</Link>
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="mb-2 text-label-lg font-bold text-primary">Platform</h4>
            <Link href="/eligibility" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Eligibility Engine</Link>
            <Link href="/exams" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Exam Explorer</Link>
            <Link href="/profile" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Profile</Link>
            <Link href="/applications" className="py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface">Application Tracker</Link>
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="mb-2 text-label-lg font-bold text-primary">Official Links</h4>
            {OFFICIAL_PORTALS.map((portal) => (
              <a
                key={portal.href}
                href={portal.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-0.5 text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                {portal.name}
              </a>
            ))}
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          © {new Date().getFullYear()} GovJobMatch. Independent eligibility indication only — not an official government service.
        </p>
      </div>
    </footer>
  );
}
